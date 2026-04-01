import { motion } from 'framer-motion';

const Card = ({ children, className = '', delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: delay * 0.1,
        ease: 'easeOut',
      }}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;
