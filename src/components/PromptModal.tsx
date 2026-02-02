"use client";

import React, { useEffect, useRef, useState } from "react";

type PromptModalProps = {
    isOpen: boolean;
    title: string;
    defaultValue: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
};

export default function PromptModal({
    isOpen,
    title,
    defaultValue,
    onConfirm,
    onCancel,
}: PromptModalProps) {
    const [value, setValue] = useState(defaultValue);
    const [error, setError] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus the input when the modal mounts
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const validate = (val: string): string => {
        if (!val) return "Tên biến không được để trống";
        if (/^\s/.test(val)) return "Tên biến không được có khoảng trắng ở đầu";
        if (/^\d/.test(val)) return "Tên biến không được bắt đầu bằng số";
        return "";
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setValue(newVal);
        setError(validate(newVal));
    };

    const handleConfirm = () => {
        const err = validate(value);
        if (err) {
            setError(err);
            return;
        }
        onConfirm(value);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900">{title}</h3>

                <input
                    ref={inputRef}
                    type="text"
                    className={`w-full rounded-md border px-3 py-2 text-zinc-900 outline-none focus:ring-2 ${
                        error
                            ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                            : "border-zinc-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleConfirm();
                        if (e.key === "Escape") onCancel();
                    }}
                />
                
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!!error || !value}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
