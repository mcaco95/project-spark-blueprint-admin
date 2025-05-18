
import { ReactNode } from 'react';
import { Navbar } from './Navbar';

type MainLayoutProps = {
  children: ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
};
