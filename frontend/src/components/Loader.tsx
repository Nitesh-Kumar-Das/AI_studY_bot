interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'gray' | 'white';
  text?: string;
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 'md', 
  color = 'blue', 
  text, 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const colorClasses = {
    blue: 'border-blue-400',
    gray: 'border-gray-400',
    white: 'border-white',
  };

  const textColorClasses = {
    blue: 'text-blue-300',
    gray: 'text-gray-300', 
    white: 'text-white',
  };

  const loaderElement = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <p className={`text-sm font-medium ${textColorClasses[color]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        {loaderElement}
      </div>
    );
  }

  return loaderElement;
};

export default Loader;
