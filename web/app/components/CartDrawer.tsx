'use client';

import React, { useState, useEffect } from 'react';
import OrderModal from './OrderModal';

export interface CartItem {
    id: number;
    name: string;
    brand: string;
    supplier_sku: string;
    supplier_name: string;
    price_ex_vat: string;
    quantity: number;
}

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    updateQuantity: (id: number, delta: number) => void;
    removeItem: (id: number) => void;
    isAccount: boolean;
}

export default function CartDrawer({ isOpen, onClose, items, updateQuantity, removeItem, isAccount }: CartDrawerProps) {
    const [mounted, setMounted] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const calculatePrice = (basePrice: string) => {
        const price = parseFloat(basePrice);
        const markedUp = isAccount ? price : price * 1.15;
        const incVat = markedUp * 1.15;
        return {
            exVat: markedUp.toFixed(2),
            incVat: incVat.toFixed(2)
        };
    };

    const totalExVat = items.reduce((sum, item) => sum + parseFloat(calculatePrice(item.price_ex_vat).exVat) * item.quantity, 0);
    const totalIncVat = totalExVat * 1.15;

    const generateEmailTemplate = () => {
        setIsOrderModalOpen(true);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[200] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">Your Quote Cart</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                <div className="p-4 bg-blue-50 rounded-full">
                                    <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                </div>
                                <p className="text-gray-500 font-medium">Your cart is empty.</p>
                                <p className="text-sm text-gray-400">Add some products to generate an order request.</p>
                            </div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-sm font-bold text-gray-900 line-clamp-2">{item.name}</h3>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">{item.brand} | {item.supplier_name}</p>
                                        <p className="text-[10px] text-gray-400 font-mono mb-3">SKU: {item.supplier_sku}</p>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-2 py-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 font-bold"
                                                >
                                                    -
                                                </button>
                                                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-blue-700">R {calculatePrice(item.price_ex_vat).exVat}</p>
                                                <p className="text-[10px] text-gray-400">EX VAT</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="p-6 border-t border-gray-100 space-y-4 bg-gray-50">
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal (Ex VAT)</span>
                                    <span>R {totalExVat.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900">
                                    <span>Total (Inc VAT)</span>
                                    <span>R {totalIncVat.toFixed(2)}</span>
                                </div>
                            </div>
                            <button
                                onClick={generateEmailTemplate}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                Generate Email Template
                            </button>
                            <p className="text-[10px] text-center text-gray-400">
                                This will open a new window with your order templates.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                items={items}
                totalExVat={totalExVat}
                totalIncVat={totalIncVat}
            />
        </>
    );
}
