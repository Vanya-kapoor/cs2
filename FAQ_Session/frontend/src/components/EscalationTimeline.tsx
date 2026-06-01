import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, AlertTriangle, ShieldAlert, Award, FileQuestion } from 'lucide-react';
import { QuestionStatus } from '../types';

interface EscalationTimelineProps {
  status: QuestionStatus;
}

export const EscalationTimeline: React.FC<EscalationTimelineProps> = ({ status }) => {
  const steps = [
    {
      id: 'open',
      label: 'Question Posted',
      desc: 'Submitted by intern',
      icon: HelpCircle,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      activeStatuses: ['OPEN', 'ANSWERED', 'ESCALATED', 'UNDER_REVIEW', 'RESOLVED']
    },
    {
      id: 'unanswered',
      label: 'No Answer',
      desc: 'Pending replies',
      icon: FileQuestion,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      activeStatuses: ['ESCALATED', 'UNDER_REVIEW', 'RESOLVED']
    },
    {
      id: 'escalated',
      label: 'Escalated',
      desc: 'Needs Attention badge',
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      activeStatuses: ['ESCALATED', 'UNDER_REVIEW', 'RESOLVED']
    },
    {
      id: 'admin_notified',
      label: 'Admin Review',
      desc: 'Mentors alerted',
      icon: ShieldAlert,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      activeStatuses: ['UNDER_REVIEW', 'RESOLVED']
    },
    {
      id: 'resolved',
      label: 'Resolved',
      desc: 'Verified FAQ posted',
      icon: Award,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      activeStatuses: ['RESOLVED']
    }
  ];

  return (
    <div className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm my-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
        <span className="text-xl">⚡</span>
        <div>
          <h4 className="font-semibold text-base text-slate-800 font-sans">Escalation Pipeline Status</h4>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none mt-1">
            Automated ticket escalation tracking
          </p>
        </div>
      </div>

      {/* Horizontal timeline for medium+ screens, vertical on mobile */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative gap-8 md:gap-4 pl-4 md:pl-0">
        {/* Connector Line (Desktop) */}
        <div className="hidden md:block absolute top-[20px] left-[5%] right-[5%] h-[2px] bg-slate-100 z-0">
          <motion.div
            className="h-full bg-blue-600"
            initial={{ width: '0%' }}
            animate={{
              width: 
                status === 'OPEN' ? '25%' : 
                status === 'ESCALATED' ? '50%' : 
                status === 'UNDER_REVIEW' ? '75%' : 
                status === 'RESOLVED' ? '100%' : '0%'
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </div>

        {/* Connector Line (Mobile) */}
        <div className="md:hidden absolute left-[20px] top-6 bottom-6 w-[2px] bg-slate-100 z-0" />

        {steps.map((step, idx) => {
          const isActive = step.activeStatuses.includes(status);
          const isPending = !isActive && idx > 0 && steps[idx - 1].activeStatuses.includes(status);

          return (
            <div 
              key={step.id} 
              className={`flex md:flex-col items-center md:text-center gap-4 md:gap-2 z-10 w-full md:w-1/5 relative transition-all duration-300 ${
                isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
              }`}
            >
              {/* Step indicator circle */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isActive ? 1.05 : 1 }}
                whileHover={{ scale: 1.08 }}
                className={`w-10 h-10 rounded-full border flex items-center justify-center text-base relative ${
                  isActive ? `${step.color} border-transparent` : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <step.icon size={16} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 border border-white text-[8px] text-white font-semibold items-center justify-center">✓</span>
                  </span>
                )}
              </motion.div>

              {/* Step Details */}
              <div className="flex flex-col items-start md:items-center">
                <span className="font-semibold text-xs md:text-sm leading-tight text-slate-800 font-sans">
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                  {step.desc}
                </span>
                {isPending && (
                  <span className="mt-1.5 px-1.5 py-0.5 text-[8px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full leading-none animate-pulse">
                    Next State
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default EscalationTimeline;
