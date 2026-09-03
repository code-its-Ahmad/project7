import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-blue-600 dark:bg-blue-800 text-white hover:bg-blue-500 dark:hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.95 }}
    >
      {theme === 'dark' ? <Sun className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> : <Moon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />}
    </motion.button>
  );
};

export default ThemeToggle;