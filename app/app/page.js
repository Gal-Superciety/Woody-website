import CommandCenter from './CommandCenter';

export const metadata = {
  title: 'WOODY Command Center',
  description: 'Live WOODY market intelligence, flows and MultiversX pool reserves.',
};

export default function WoodyApp() {
  return <main className="dashboard-shell"><CommandCenter /></main>;
}
