import Board from '../components/Board';

export default function Home() {
  return (
    <div className="p-4">
      <h1 className="text-2x1 font-bold mb-4 flex justify-center heading">Kanban Board</h1>
      <Board />
    </div>
  );
}
