import prisma from '../config/prisma';

async function inspectDatabase() {
  console.log('--- DATABASE INSPECTION START ---');
  try {
    // 1. Connection check
    await prisma.$connect();
    console.log('✔ Connected to database successfully.');

    // 2. Check if _prisma_migrations exists
    const migrationTable: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = '_prisma_migrations';
    `;
    console.log('_prisma_migrations table exists:', migrationTable.length > 0);

    if (migrationTable.length > 0) {
      const migrations: any[] = await prisma.$queryRaw`
        SELECT id, migration_name, applied_steps_count, started_at, finished_at 
        FROM _prisma_migrations ORDER BY started_at ASC;
      `;
      console.log('Existing applied migrations count:', migrations.length);
      console.log(migrations);
    }

    // 3. List all tables in public schema
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != '_prisma_migrations'
      ORDER BY table_name ASC;
    `;
    console.log(`\nFound ${tables.length} tables in public schema:`);

    for (const t of tables) {
      const tableName = t.table_name;
      try {
        const countResult: any[] = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int as count FROM "${tableName}"`
        );
        const count = countResult[0]?.count ?? 0;
        console.log(` - ${tableName}: ${count} rows`);
      } catch (err: any) {
        console.log(` - ${tableName}: Error counting rows: ${err.message}`);
      }
    }

    // 4. List all foreign keys
    const foreignKeys: any[] = await prisma.$queryRaw`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
      ORDER BY tc.table_name, kcu.column_name;
    `;
    console.log(`\nFound ${foreignKeys.length} Foreign Keys in public schema.`);

    // 5. List all unique constraints and indexes
    const indexes: any[] = await prisma.$queryRaw`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    console.log(`\nFound ${indexes.length} Indexes in public schema.`);

    console.log('\n--- DATABASE INSPECTION COMPLETE ---');
  } catch (err: any) {
    console.error('Inspection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDatabase();
