import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import { STEMLogo } from '../../components/STEMLogo';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Award,
  Calendar,
  User,
  Printer,
} from 'lucide-react';

export const CertificateVerifyPage: React.FC = () => {
  const { certNumber } = useParams<{ certNumber?: string }>();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState<string>(certNumber || 'STP-2027-0001');
  const [certData, setCertData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleVerify = async (codeToVerify: string) => {
    if (!codeToVerify) return;
    setLoading(true);
    setErrorMsg('');
    setCertData(null);
    setHasSearched(true);

    try {
      const data = await api.verifyCertificate(codeToVerify.trim());
      setCertData(data.certificate);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Certificate reference not recognized.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certNumber) {
      setInputCode(certNumber);
      handleVerify(certNumber);
    } else {
      // Demo load sample cert STP-2027-0001
      handleVerify('STP-2027-0001');
    }
  }, [certNumber]);

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="blue">Official Registry</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            STEMPACT Certificate Verification
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Verify the authenticity of credentials, professional diplomas, and fellowship certificates issued by STEMPACT
            ACADEMY (Ile-Ife, Osun State, Nigeria).
          </p>

          {/* Verification Search Bar */}
          <div className="max-w-xl mx-auto pt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/verify/${inputCode.trim().toUpperCase()}`);
                handleVerify(inputCode.trim());
              }}
              className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-xl border border-slate-200"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter Certificate Number (e.g. STP-2027-0001)..."
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 font-mono uppercase focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify Now'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Verification Result Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {loading ? (
          <LoadingSpinner message="Validating certificate against STEMPACT academic registry..." />
        ) : errorMsg ? (
          <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Certificate Verification Failed</h2>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{errorMsg}</p>
            <p className="text-[11px] text-slate-500">
              Please ensure the certificate number is spelled accurately, or contact admissions@stempact.org.
            </p>
          </div>
        ) : certData ? (
          <div className="space-y-6">
            {/* Status Alert */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    Official Authentic Credential Verified
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Registered in the STEMPACT Academic Council Ledger
                  </div>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Record</span>
              </button>
            </div>

            {/* Official Certificate Card Mockup */}
            <div className="bg-white rounded-3xl border-8 border-slate-900 p-8 sm:p-14 shadow-2xl relative overflow-hidden text-center space-y-6 print:m-0 print:border-none">
              {/* Corner Watermarks */}
              <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-400 font-bold">
                REF: {certData.certificateNumber}
              </div>
              <div className="absolute top-4 right-4 text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                VERIFIED & VALID
              </div>

              {/* Logo */}
              <div className="flex justify-center pt-2">
                <STEMLogo size="lg" showSubtitle={false} />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  STEMPACT ACADEMY • ILE-IFE, OSUN STATE, NIGERIA
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                  {certData.certificateType.replace(/_/g, ' ')} CERTIFICATE
                </h2>
                <p className="text-xs text-slate-400 italic">
                  Stem Skills for Real World Impact
                </p>
              </div>

              <div className="py-2 text-xs text-slate-600">
                This is to officially certify that
              </div>

              <div className="text-2xl sm:text-3xl font-black text-blue-900 font-serif border-b-2 border-slate-200 pb-2 max-w-lg mx-auto">
                {certData.studentName}
              </div>

              <div className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                has successfully mastered all practical laboratory milestones, course modules, and defended the
                prescribed capstone project in
              </div>

              <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                {certData.programName}
              </div>

              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-4 rounded-full inline-block border border-emerald-200">
                {certData.achievement}
              </div>

              {/* Signers & Issue Date */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-1">
                  <div className="font-serif italic text-sm text-slate-800">
                    {certData.signers?.[0]?.name || 'Dr. Folashade Adeleke'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {certData.signers?.[0]?.title || 'Director of Academic Affairs'}
                  </div>
                </div>

                <div className="space-y-1 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-500 flex items-center justify-center text-[9px] font-bold text-amber-700 bg-amber-50 uppercase">
                    SEAL
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Date:{' '}
                    {new Date(certData.issueDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-serif italic text-sm text-slate-800">
                    {certData.signers?.[1]?.name || 'Babatunde Olatunji'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {certData.signers?.[1]?.title || 'Executive Director'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
