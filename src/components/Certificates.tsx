import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { Award, ExternalLink, ShieldCheck, X, Sparkles, Search } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useSound } from '../context/SoundContext';
import { Certificate } from '../api/services';
import { EASE_OUT, flipInY } from '../lib/motion';

const Certificates = () => {
  const { certificates } = usePortfolio();
  const { playClick, playHover, playWhoosh } = useSound();
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [selectedIssuer, setSelectedIssuer] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const issuers = useMemo(() => {
    const set = new Set<string>();
    certificates.forEach((c) => {
      if (c.issuer) set.add(c.issuer);
    });
    return ['All', ...Array.from(set)];
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const matchesIssuer = selectedIssuer === 'All' || c.issuer === selectedIssuer;
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesIssuer && matchesSearch;
    });
  }, [certificates, selectedIssuer, searchQuery]);

  return (
    <section
      id="certificates"
      className="min-h-screen py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto w-full space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="text-center space-y-2.5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400 backdrop-blur-md"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Verified Credentials & Honors</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, ease: EASE_OUT }}
            className="text-2xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 bg-clip-text text-transparent"
          >
            Certifications & Accreditations
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, ease: EASE_OUT }}
            className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Formally accredited credentials from industry leaders and universities including Meta, Stanford University, Google Cloud, and AWS.
          </motion.p>
        </div>

        {/* Filter and Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-gray-200 dark:border-gray-800 shadow-xl"
        >
          {/* Issuer Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {issuers.map((issuer) => (
              <motion.button
                key={issuer}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  playWhoosh();
                  setSelectedIssuer(issuer);
                }}
                onMouseEnter={playHover}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedIssuer === issuer
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25 scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {issuer}
              </motion.button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search certificates..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Certificates Grid with 3D Card Entrances */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 perspective-1000">
          <AnimatePresence>
            {filteredCertificates.map((cert, index) => (
              <motion.div
                layout
                key={cert.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.25), ease: EASE_OUT }}
              >
                <Tilt
                  tiltMaxAngleX={6}
                  tiltMaxAngleY={6}
                  perspective={1000}
                  scale={1.02}
                  transitionSpeed={500}
                  tiltEnable={typeof window !== 'undefined' ? window.innerWidth > 768 : true}
                  className="h-full"
                >
                  <div
                    onClick={() => {
                      playClick();
                      setSelectedCert(cert);
                    }}
                    onMouseEnter={playHover}
                    className="relative overflow-hidden h-full p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border border-gray-200 dark:border-gray-800 hover:border-amber-500/50 shadow-xl flex flex-col justify-between space-y-4 transition-all cursor-pointer group"
                  >
                    {/* Top ambient shimmer sweep on hover */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                          <Award className="w-5 h-5" />
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60">
                          {cert.year}
                        </span>
                      </div>

                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {cert.issuer}
                        </div>
                        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white mt-0.5 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                          {cert.title}
                        </h3>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                        {cert.description}
                      </p>

                      {cert.credential_id && (
                        <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/80 p-2 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                          ID: {cert.credential_id}
                        </div>
                      )}
                    </div>

                    {/* Verification footer */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                      {cert.credential_url ? (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>Verify Credential</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400 font-semibold text-[11px]">Accredited Certificate</span>
                      )}

                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                </Tilt>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredCertificates.length === 0 && (
          <div className="text-center py-10 space-y-2">
            <p className="text-sm text-gray-500">No credentials match your query.</p>
            <button
              onClick={() => {
                setSelectedIssuer('All');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Certificate Lightbox Modal with Elastic Physics */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCert(null)}
            />

            <motion.div
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-7 z-10 space-y-5"
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                      {selectedCert.title}
                    </h3>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      Issued by {selectedCert.issuer} ({selectedCert.year})
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedCert.description}
                </p>

                {selectedCert.credential_id && (
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                    <strong>Verification ID:</strong> {selectedCert.credential_id}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                {selectedCert.credential_url ? (
                  <a
                    href={selectedCert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-500/20 transition-all active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Official Verification</span>
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">Authenticated Credential</span>
                )}

                <button
                  onClick={() => setSelectedCert(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Certificates;