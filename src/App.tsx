import { MenuBar } from './components/layout/MenuBar';
import { MainToolbar } from './components/toolbar/MainToolbar';
import { MainLayout } from './components/layout/MainLayout';

function App() {
  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ background: 'var(--color-surface)' }}
    >
      <MenuBar />
      <MainToolbar />
      <MainLayout />
    </div>
  );
}

export default App;
