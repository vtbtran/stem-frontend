import React from 'react';
import * as Blockly from 'blockly';
import { TOOLBOX_CONFIG, CustomCategory } from './toolboxConfig';
import Image from 'next/image';

interface ToolboxProps {
    workspace: Blockly.WorkspaceSvg | null;
    className?: string;
    activeCategory?: string;
    onCategoryClick: (categoryName: string) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    "control-category": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-500" },
    "hardware-category": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-500" },
    "speech-category": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-500" },
    "sound-category": { bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-500" },
    "logic-category": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-500" },
    "loops-category": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-500" },
    "math-category": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-500" },
    "text-category": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-500" },
    "list-category": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-500" },
    "variable-category": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-500" },
    "function-category": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-500" },
};

export const Toolbox: React.FC<ToolboxProps> = ({ workspace, className, activeCategory, onCategoryClick }) => {
    const categories = TOOLBOX_CONFIG.contents.filter((c): c is CustomCategory => c.kind === 'category');

    const handleClick = (category: CustomCategory) => {
        if (!workspace) return;

        // Notify parent to update active state
        onCategoryClick(category.name);

        const toolbox = workspace.getToolbox() as Blockly.Toolbox;
        if (toolbox && toolbox.getToolboxItems) {
            const item = toolbox.getToolboxItems().find((i) => {
                // Check if 'getName' exists on the item (it might be ICollapsibleToolboxItem or similar)
                return 'getName' in i && typeof (i as any).getName === 'function' && (i as any).getName() === category.name;
            });
            if (item) {
                toolbox.setSelectedItem(item);
            }
        }
    };

    return (
        <div className={`flex flex-col w-48 bg-white border-r border-slate-200 h-full overflow-y-auto ${className}`}>
            {categories.map((cat, index) => {
                const style = CATEGORY_COLORS[cat.categorystyle || ""] || { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-400" };
                const isActive = activeCategory === cat.name;

                return (
                    <button
                        key={index}
                        onClick={() => handleClick(cat)}
                        className={`
              flex items-center px-3 py-3 w-full text-left transition-all duration-200 border-l-[3px]
              ${isActive ? `${style.bg} ${style.text} ${style.border}` : 'hover:bg-slate-50 text-slate-600 border-transparent'}
            `}
                    >
                        {/* Icon */}
                        <div className="flex-shrink-0 w-6 h-6 mr-3 relative flex items-center justify-center">
                            {cat.imageUrl ? (
                                <div
                                    className="w-6 h-6 bg-current transition-colors duration-200"
                                    style={{
                                        maskImage: `url("${cat.imageUrl}")`,
                                        maskRepeat: 'no-repeat',
                                        maskPosition: 'center',
                                        maskSize: 'contain',
                                        WebkitMaskImage: `url("${cat.imageUrl}")`,
                                        WebkitMaskRepeat: 'no-repeat',
                                        WebkitMaskPosition: 'center',
                                        WebkitMaskSize: 'contain'
                                    }}
                                />
                            ) : (
                                <span className="material-icons-round text-lg">
                                    {isActive ? 'radio_button_checked' : 'radio_button_unchecked'}
                                </span>
                            )}
                        </div>

                        {/* Label */}
                        <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                            {cat.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
