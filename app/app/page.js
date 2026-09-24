import WalletConnectPanel from './WalletConnectPanel';
import CommandCenter from './CommandCenter';

export const metadata = {
  title: 'WOODY Command Center',
  description: 'Live WOODY market intelligence and MultiversX wallet dashboard.',
};

export default function WoodyApp() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 md:px-8 md:py-8">
      <section className="card cyber-grid relative overflow-hidden p-5 md:p-8">
        <WalletConnectPanel />
      </section>
      <CommandCenter />
    </main>
  );
}
