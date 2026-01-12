import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import Activities from './Activities';
import Events from "./Events";
import Friends from "./Friends";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Activities />} />
        <Route path="/events" element={<Events />} />
        <Route path="/friends" element={<Friends />} />
      </Routes>
    </Router>
  );
}

export default App;

