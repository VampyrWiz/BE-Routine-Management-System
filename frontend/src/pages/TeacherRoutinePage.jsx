/** Page wrapper that renders the TeacherScheduleManager component. */
import React from 'react';
import TeacherScheduleManager from '../components/TeacherScheduleManager';

/**
 * Teacher Routine Management Page
 * 
 * Enhanced teacher schedule management with:
 * - Professional UI matching routine manager design
 * - Real-time synchronization with routine changes
 * - Comprehensive schedule display and statistics
 * - Excel export functionality
 * - Automatic cache invalidation for data consistency
 */
/** Page that embeds the TeacherScheduleManager component. */
const TeacherRoutinePage = () => {
  return (
    <div className="teacher-routine-management mobile-stack-vertical" style={{ padding: '24px' }}>
      <TeacherScheduleManager />
    </div>
  );
};

export default TeacherRoutinePage;
