'use client';

import React, { useEffect, useRef } from 'react';

interface AccessPortalModalProps {
    isOpen: boolean;
    onClose: () => void;
    passphrase: string;
    setPassphrase: (val: string) => void;
    passphraseError: string;
    onVerify: () => void;
    isAuthenticating: boolean;
}

const AccessPortalModal: React.FC<AccessPortalModalProps> = ({
    isOpen,
    onClose,
    passphrase,
    setPassphrase,
    passphraseError,
    onVerify,
    isAuthenticating,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-[3rem] p-10 max-w-lg w-full animate-in zoom-in-95 duration-300 shadow-2xl border border-white/20">
                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">Access Portal</h3>
                <p className="text-gray-400 font-medium mb-8 text-sm uppercase tracking-widest">Verify your credentials</p>
                <input
                    ref={inputRef}
                    type="password"
                    placeholder="Passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onVerify()}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl mb-4 focus:ring-2 focus:ring-orange-500/20 text-lg outline-none text-gray-900 dark:text-white font-bold"
                />
                {passphraseError && <p className="text-xs font-bold text-red-500 mb-4 ml-2 uppercase tracking-widest">{passphraseError}</p>}
                <button
                    onClick={onVerify}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black py-4 rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-gray-400/20 active:scale-[0.98]"
                >
                    {isAuthenticating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Enter Portal'}
                </button>
            </div>
        </div>
    );
};

export default AccessPortalModal;
