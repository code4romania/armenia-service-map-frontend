import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopicForm } from './topic-form';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values ? `${key}:${Object.values(values).join(',')}` : key,
}));

describe('TopicForm', () => {
  it('adds a new subtopic row and validates duplicate names', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TopicForm mode="create" onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'form.addSubtopic' }));
    await user.type(screen.getByLabelText('entities.serviceTopic'), 'Psychological help');
    await user.type(screen.getAllByLabelText('form.subtopicName')[0], 'Counselling');
    await user.click(screen.getByRole('button', { name: 'form.addSubtopic' }));
    await user.type(screen.getAllByLabelText('form.subtopicName')[1], 'Counselling');
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));

    expect(await screen.findAllByText('form.duplicateName')).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the picked icon and lets it be cleared', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TopicForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('entities.serviceTopic'), 'Grants');
    await user.click(screen.getByRole('button', { name: 'grants' }));
    expect(screen.getByRole('button', { name: 'grants' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));
    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ icon: 'grants' }));

    await user.click(screen.getByRole('button', { name: 'grants' }));
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));
    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ icon: '' }));
  });

  it('submits inline switch states for topic and subtopics', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TopicForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('entities.serviceTopic'), 'Psychological help');
    await user.click(screen.getByRole('switch', { name: 'form.topicStatusAria' }));
    await user.click(screen.getByRole('button', { name: 'form.addSubtopic' }));
    await user.type(screen.getByLabelText('form.subtopicName'), 'Counselling');
    await user.click(screen.getByRole('switch', { name: 'form.subtopicStatusAria:1' }));
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'INACTIVE',
        subtopics: [
          expect.objectContaining({
            name: 'Counselling',
            status: 'INACTIVE',
          }),
        ],
      }),
    );
  });
});
