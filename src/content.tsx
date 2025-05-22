import { Divider } from '@heroui/divider'

import { Sidebar } from '@/components/page/sidebar'
import { LysandraGame } from '@/pages/games/lysandra-game'

export const Content: React.FC = () => {
  return (
    <>
      {/* Navigation */}
      <Sidebar />

      <Divider orientation="vertical" />

      {/* Pages */}
      <LysandraGame />
    </>
  )
}
