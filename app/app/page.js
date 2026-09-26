import WalletConnectPanel from './WalletConnectPanel';
import CommandCenter from './CommandCenter';

export const metadata = {
  title: 'WOODY Command Center',
  description: 'Live WOODY market intelligence and MultiversX wallet dashboard.',
};

export default function WoodyApp() {
  return (
    <main className="dashboard-shell">
      <CommandCenter><WalletConnectPanel /></CommandCenter>
    </main>
  );
}
