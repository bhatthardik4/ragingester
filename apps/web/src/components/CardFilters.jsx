import React from 'react';
import { SOURCE_TYPES } from '@ragingester/shared';

const sourceOptions = Object.values(SOURCE_TYPES);

export function CardFilters({ filters, onChange }) {
  return (
    <div className="panel">
      <h2>Filter Jobs</h2>
      <div className="grid-2">
        <div>
          <label>Job type</label>
          <select value={filters.jobType} onChange={(e) => onChange({ ...filters, jobType: e.target.value })}>
            <option value="all">All</option>
            {sourceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Job name</label>
          <input
            value={filters.jobName}
            onChange={(e) => onChange({ ...filters, jobName: e.target.value })}
            placeholder="Search by job name"
          />
        </div>
      </div>
    </div>
  );
}