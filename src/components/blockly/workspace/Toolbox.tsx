import React from 'react';
import * as Blockly from 'blockly';
import { TOOLBOX_CONFIG, CustomCategory } from './toolboxConfig';

interface ToolboxProps {
    workspace: Blockly.WorkspaceSvg | null;
    className?: string;
    activeCategory?: string;
    onCategoryClick: (categoryName: string) => void;
}

// Define color themes for each category style
const CATEGORY_THEMES: Record<string, { activeBg: string; activeText: string; activeRing: string }> = {
    "control-category": { activeBg: "bg-blue-50", activeText: "text-blue-600", activeRing: "ring-blue-100" },
    "hardware-category": { activeBg: "bg-emerald-50", activeText: "text-emerald-600", activeRing: "ring-emerald-100" },
    "speech-category": { activeBg: "bg-cyan-50", activeText: "text-cyan-600", activeRing: "ring-cyan-100" },
    "sound-category": { activeBg: "bg-fuchsia-50", activeText: "text-fuchsia-600", activeRing: "ring-fuchsia-100" },
    "logic-category": { activeBg: "bg-amber-50", activeText: "text-amber-600", activeRing: "ring-amber-100" },
    "loops-category": { activeBg: "bg-violet-50", activeText: "text-violet-600", activeRing: "ring-violet-100" },
    "math-category": { activeBg: "bg-rose-50", activeText: "text-rose-600", activeRing: "ring-rose-100" },
    "text-category": { activeBg: "bg-orange-50", activeText: "text-orange-600", activeRing: "ring-orange-100" },
    "list-category": { activeBg: "bg-indigo-50", activeText: "text-indigo-600", activeRing: "ring-indigo-100" },
    "variable-category": { activeBg: "bg-rose-50", activeText: "text-rose-600", activeRing: "ring-rose-100" },
    "function-category": { activeBg: "bg-violet-50", activeText: "text-violet-600", activeRing: "ring-violet-100" },
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
                const itemWithName = i as Blockly.IToolboxItem & { getName?: () => string };
                return typeof itemWithName.getName === 'function' && itemWithName.getName() === category.name;
            });
            if (item) {
                toolbox.setSelectedItem(item);
            }
        }
    };

    return (
        <div className={`flex flex-col w-56 bg-white border-r border-slate-200 h-full overflow-y-auto py-4 px-3 gap-1 ${className}`}>
            {categories.map((cat, index) => {
                const isActive = activeCategory === cat.name;
                // Get theme or default to blue if not found
                const theme = CATEGORY_THEMES[cat.categorystyle || ""] || CATEGORY_THEMES["control-category"];

                return (
                    <button
                        key={index}
                        onClick={() => handleClick(cat)}
                        className={`
                            flex items-center w-full text-left transition-all duration-200
                            h-11 px-3 rounded-xl
                            ${isActive
                                ? `${theme.activeBg} ${theme.activeText} shadow-sm ring-1 ${theme.activeRing}`
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                            }
                        `}
                    >
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-5 h-5 mr-3 relative flex items-center justify-center transition-colors ${isActive ? 'text-current' : 'text-slate-500'}`}>
                            {cat.imageUrl ? (
                                <div
                                    className="w-5 h-5 bg-current transition-colors duration-200"
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
                                    {cat.cssConfig?.icon || (isActive ? 'radio_button_checked' : 'radio_button_unchecked')}
                                </span>
                            )}
                        </div>

                        {/* Label */}
                        <span className={`text-sm tracking-wide ${isActive ? 'font-semibold' : 'font-medium'}`}>
                            {cat.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
