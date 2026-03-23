import { mockRooms } from '@/data/rooms';

export function generateStaticParams() {
  return mockRooms.map(room => ({ id: room.id }));
}

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
