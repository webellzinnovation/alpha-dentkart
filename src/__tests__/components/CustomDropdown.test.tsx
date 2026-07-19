import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomDropdown } from '../../../components/CustomDropdown';

const options = [
  { value: '1', label: 'Option One' },
  { value: '2', label: 'Option Two' },
  { value: '3', label: 'Option Three' },
];

describe('CustomDropdown', () => {
  it('renders with selected value label', () => {
    render(<CustomDropdown value="1" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Option One')).toBeDefined();
  });

  it('shows raw value when no matching option', () => {
    render(<CustomDropdown value="unknown" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('unknown')).toBeDefined();
  });

  it('opens dropdown on click', () => {
    render(<CustomDropdown value="1" onChange={vi.fn()} options={options} />);
    fireEvent.click(screen.getByText('Option One'));
    expect(screen.getByText('Option Two')).toBeDefined();
    expect(screen.getByText('Option Three')).toBeDefined();
  });

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn();
    render(<CustomDropdown value="1" onChange={onChange} options={options} />);
    fireEvent.click(screen.getByText('Option One'));
    fireEvent.click(screen.getByText('Option Two'));
    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('closes dropdown after selection', () => {
    render(<CustomDropdown value="1" onChange={vi.fn()} options={options} />);
    fireEvent.click(screen.getByText('Option One'));
    fireEvent.click(screen.getByText('Option Two'));
    expect(screen.queryByText('Option Three')).toBeNull();
  });

  it('supports string options', () => {
    render(<CustomDropdown value="apple" onChange={vi.fn()} options={['apple', 'banana', 'cherry']} />);
    expect(screen.getByText('apple')).toBeDefined();
    fireEvent.click(screen.getByText('apple'));
    expect(screen.getByText('banana')).toBeDefined();
  });

  it('supports number options', () => {
    render(<CustomDropdown value={1} onChange={vi.fn()} options={[1, 2, 3]} />);
    expect(screen.getByText('1')).toBeDefined();
  });

  it('highlights selected option', () => {
    const { container } = render(<CustomDropdown value="2" onChange={vi.fn()} options={options} />);
    fireEvent.click(screen.getByText('Option Two'));
    const dropdownPanel = container.querySelector('.absolute.z-50');
    const optionBtns = dropdownPanel?.querySelectorAll('button');
    const selectedBtn = Array.from(optionBtns || []).find(btn => btn.textContent === 'Option Two');
    expect(selectedBtn?.className).toContain('font-bold');
  });

  it('renders chevron icon', () => {
    const { container } = render(<CustomDropdown value="1" onChange={vi.fn()} options={options} />);
    const chevron = container.querySelector('.fa-chevron-down');
    expect(chevron).not.toBeNull();
  });
});
