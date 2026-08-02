// Design system barrel — import everything from one place:
//   import { Button, Card, Modal, useToast } from '../components/ui';

// Layout & structure
export { default as Container } from './Container';
export { default as PageHeader } from './PageHeader';
export { default as Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from './Card';
export { default as Background } from './Background';

// Controls
export { default as Button } from './Button';
export { default as IconButton } from './IconButton';
export { default as Input, Textarea } from './Input';
export { default as Select } from './Select';
export { default as Tabs } from './Tabs';

// Identity
export { default as Logo, LogoMark } from './Logo';
export { default as Avatar } from './Avatar';

// Feedback & status
export { default as Badge } from './Badge';
export { default as Spinner } from './Spinner';
export { default as Skeleton, SkeletonText } from './Skeleton';
export { default as EmptyState } from './EmptyState';
export { default as ThinkingIndicator } from './ThinkingIndicator';
export { ToastProvider, useToast } from './Toast';

// Overlays
export { default as Modal } from './Modal';
export { default as Drawer } from './Drawer';
export { default as Dropdown } from './Dropdown';
export { default as Tooltip } from './Tooltip';
export { default as Portal } from './Portal';

export { cn } from '../../lib/cn';
