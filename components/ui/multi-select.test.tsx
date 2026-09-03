import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MultiSelect } from '@/components/ui/multi-select';

const options = [
  { value: 'yerevan', label: 'Yerevan' },
  { value: 'shirak', label: 'Shirak' },
  { value: 'lori', label: 'Lori' },
];

function renderSelect(selected: string[], onChange = vi.fn()) {
  render(
    <MultiSelect
      aria-label="Regions"
      options={options}
      selected={selected}
      onChange={onChange}
      placeholder="Select regions..."
      selectedLabel={(count) => `${count} selected`}
      selectAllLabel="Select all"
      clearAllLabel="Clear"
    />,
  );
  return onChange;
}

describe('MultiSelect', () => {
  it('shows the placeholder and reveals options on click', () => {
    renderSelect([]);
    const trigger = screen.getByLabelText('Regions');
    expect(trigger).toHaveTextContent('Select regions...');
    expect(screen.queryByText('Yerevan')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByText('Yerevan')).toBeInTheDocument();
    expect(screen.getByText('Lori')).toBeInTheDocument();
  });

  it('summarises the selection count and toggles values', () => {
    const onChange = renderSelect(['yerevan']);
    const trigger = screen.getByLabelText('Regions');
    expect(trigger).toHaveTextContent('1 selected');

    fireEvent.click(trigger);
    fireEvent.click(screen.getByLabelText('Shirak'));
    expect(onChange).toHaveBeenCalledWith(['yerevan', 'shirak']);

    fireEvent.click(screen.getByLabelText('Yerevan'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('selects every option with "Select all" when not all are selected', () => {
    const onChange = renderSelect(['yerevan']);
    fireEvent.click(screen.getByLabelText('Regions'));
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
    expect(onChange).toHaveBeenCalledWith(['yerevan', 'shirak', 'lori']);
  });

  it('offers "Clear" instead once every option is selected', () => {
    const onChange = renderSelect(['yerevan', 'shirak', 'lori']);
    fireEvent.click(screen.getByLabelText('Regions'));
    expect(screen.queryByRole('button', { name: 'Select all' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('hides the select-all row when no labels are provided', () => {
    render(
      <MultiSelect
        aria-label="Regions"
        options={options}
        selected={[]}
        onChange={vi.fn()}
        placeholder="Select regions..."
        selectedLabel={(count) => `${count} selected`}
      />,
    );
    fireEvent.click(screen.getByLabelText('Regions'));
    expect(screen.queryByRole('button', { name: 'Select all' })).not.toBeInTheDocument();
  });
});
