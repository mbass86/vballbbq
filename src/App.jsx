import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Standings from './pages/Standings';
import Schedule from './pages/Schedule';
import Teams from './pages/Teams';
import Rules from './pages/Rules';
import TVMode from './pages/TVMode';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Standings />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="teams" element={<Teams />} />
          <Route path="rules" element={<Rules />} />
        </Route>
        <Route path="/tv" element={<TVMode />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
