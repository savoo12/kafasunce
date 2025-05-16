export interface FilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  activeClass?: string;
  inactiveClass?: string;
}

/**
 * A reusable button for filter/toggle controls with customizable active/inactive styles
 */
export default function FilterButton({
  label,
  active,
  onClick,
  activeClass = 'bg-blue-500 text-white',
  inactiveClass = 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
}: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${active ? activeClass : inactiveClass}`}
    >
      {label}
    </button>
  );
} 