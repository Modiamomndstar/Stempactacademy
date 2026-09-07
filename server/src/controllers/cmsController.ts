import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

export const getCMSContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const [events, blogPosts, testimonials, partners, announcements] = await Promise.all([
      prisma.event.findMany({ orderBy: { startDate: 'asc' } }),
      prisma.blogPost.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' } }),
      prisma.testimonial.findMany({ where: { isFeatured: true } }),
      prisma.partner.findMany({ where: { isFeatured: true } }),
      prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    res.status(200).json({
      events,
      blogPosts,
      testimonials,
      partners,
      announcements,
      contact: {
        address: 'STEMPACT Innovation Hub, 14 Fajuyi Road, Ile-Ife, Osun State, Nigeria',
        email: 'admissions@stempact.org',
        phone: '+234 803 123 4567',
        whatsapp: 'https://wa.me/2348031234567',
        workingHours: 'Mon - Fri: 8:00 AM - 6:00 PM, Sat: 9:00 AM - 4:00 PM',
      },
    });
  } catch (error: any) {
    console.error('getCMSContent error:', error);
    res.status(500).json({ message: 'Failed to fetch CMS content' });
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, targetAudience, priority } = req.body;
    const authorId = req.user?.id;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        targetAudience: targetAudience || 'ALL',
        priority: priority || 'NORMAL',
        authorId,
      },
    });

    res.status(201).json({ message: 'Announcement broadcasted successfully', announcement });
  } catch (error: any) {
    console.error('createAnnouncement error:', error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
};

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, category, startDate, location, isVirtual, virtualLink } = req.body;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        category: category || 'Workshop',
        startDate: new Date(startDate),
        location: location || 'STEMPACT Hub, Ile-Ife',
        isVirtual: Boolean(isVirtual),
        virtualLink,
      },
    });

    res.status(201).json({ message: 'Event published', event });
  } catch (error: any) {
    console.error('createEvent error:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
};

export const createBlogPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, excerpt, content, author, category, readTime } = req.body;
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title,
        excerpt,
        content,
        author: author || 'STEMPACT Editorial Team',
        category: category || 'STEM Education',
        readTime: readTime || '5 min read',
      },
    });

    res.status(201).json({ message: 'Blog post published', post });
  } catch (error: any) {
    console.error('createBlogPost error:', error);
    res.status(500).json({ message: 'Failed to publish post' });
  }
};
