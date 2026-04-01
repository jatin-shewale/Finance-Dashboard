import { FiAlertCircle, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const Alert = ({ type = 'info', message, onClose }) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: FiCheckCircle,
    error: FiXCircle,
    warning: FiAlertCircle,
    info: FiAlertCircle,
  };

  const Icon = icons[type] || icons.info;

  return (
    <div className={`border rounded-lg p-4 flex items-start space-x-3 ${styles[type]}`}>
      <Icon className="text-xl flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current opacity-70 hover:opacity-100"
        >
          <FiXCircle />
        </button>
      )}
    </div>
  );
};

export default Alert;
