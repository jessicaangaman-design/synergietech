import React from "react";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex justify-center h-screen max-h-full overflow-hidden lg:px-0 md:px-12">
      {children}
    </div>
  );
};

export default PageLayout;
