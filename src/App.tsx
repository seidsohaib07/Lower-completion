import { AppHeader } from './components/layout/AppHeader';
import { MainToolbar } from './components/toolbar/MainToolbar';
import { MainLayout } from './components/layout/MainLayout';

function App() {
  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ background: 'var(--color-surface)' }}
    >
      <AppHeader />
      <MainToolbar />
      <MainLayout />
    </div>
  );
}

export default App;
