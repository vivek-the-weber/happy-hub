interface StoreFooterProps {
  storeName: string;
}

export function StoreFooter({ storeName }: StoreFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 text-center">
      <p className="text-neutral-500 text-sm uppercase tracking-wider">
        © {storeName} {currentYear}
      </p>
    </footer>
  );
}
