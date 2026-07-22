
/** Page wrapper that renders the RoomScheduleManager component. */
import React from 'react';
import RoomScheduleManager from '../components/RoomScheduleManager';

/** Page that embeds the RoomScheduleManager component. */
const RoomRoutinePage = () => {
  return (
    <div style={{ padding: 24 }}>
      <RoomScheduleManager />
    </div>
  );
};

export default RoomRoutinePage;
