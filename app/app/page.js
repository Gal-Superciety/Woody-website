import WalletConnectPanel from './WalletConnectPanel';
import CommandCenter from './CommandCenter';

export const metadata = {
  title: 'WOODY dApp Hub',
  description: 'Explore the MultiversX ecosystem, track WOODY market activity, and view your wallet portfolio.',
};

export default function WoodyApp() {
  return (
    <main className="dashboard-shell">
      <CommandCenter><WalletConnectPanel /></CommandCenter>
    </main>
  );
}
