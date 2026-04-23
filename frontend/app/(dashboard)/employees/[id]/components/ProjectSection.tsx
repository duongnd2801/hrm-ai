'use client';

import React from 'react';
import Link from 'next/link';
import { EmployeeProject, ProjectRole } from '@/types';

type Props = {
  projects: EmployeeProject[];
};

const projectRoleLabelMap: Record<ProjectRole, string> = {
  PM: 'PM',
  DEV: 'DEV',
  QA: 'QA',
  TESTER: 'Tester',
  BA: 'BA',
  DESIGNER: 'Designer',
  COMTER: 'Comter',
  GUEST: 'Guest',
};

export default function ProjectSection({ projects }: Props) {
  return (
    <div className="relative group glass-dark backdrop-blur-3xl rounded-[40px] p-8 shadow-2xl dark:shadow-3xl transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-cyan-500 via-indigo-500 to-violet-500 rounded-[40px] transition-all duration-300" />
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-[0.22em] mb-2">Dự án hiện tại</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {projects.length}/2 dự án
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black">
            {projects.length}
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.03] p-6 text-center">
            <p className="text-[11px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.18em] leading-relaxed">
              Chưa tham gia dự án nào
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 2).map((project) => (
              <Link
                key={project.projectId}
                href={`/projects/${project.projectId}`}
                className="block rounded-3xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/[0.04] p-4 transition-all hover:bg-white/80 dark:hover:bg-white/[0.08] hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-2xl flex shrink-0 items-center justify-center text-white font-black shadow-lg"
                    style={{ backgroundColor: project.projectColor || '#6366f1' }}
                  >
                    {project.projectName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight break-words">
                        {project.projectName}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase tracking-widest">
                        {projectRoleLabelMap[project.role]}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/35">
                      <span>{project.projectCode}</span>
                      <span className="w-1 h-1 rounded-full bg-current" />
                      <span>{project.projectStatus}</span>
                    </div>
                    {project.joinedAt && (
                      <p className="mt-3 text-[10px] font-bold text-slate-500 dark:text-white/30">
                        Tham gia từ {new Date(project.joinedAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
