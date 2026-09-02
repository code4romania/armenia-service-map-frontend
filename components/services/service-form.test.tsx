import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ALL_REGIONS, ServiceForm, type ServiceFormState } from '@/components/services/service-form';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    if (!values) return key;
    return Object.entries(values).reduce(
      (acc, [name, value]) => acc.replace(`{${name}}`, String(value)),
      key,
    );
  },
}));

vi.mock('@/lib/api/services', () => ({
  usePublicTopics: () => ({ data: [{ id: 'topic-1', name: 'Topic 1', children: [] }] }),
  usePublicRegions: () => ({
    data: [{ id: 'region-1', name: 'Yerevan', slug: 'yerevan', svgPathId: 'p1' }],
  }),
  usePublicTargetGroups: () => ({ data: [{ id: 'tg-1', name: 'TG 1' }] }),
}));

vi.mock('@/components/shared/rich-text-editor', () => ({
  RichTextEditor: ({ content, onChange }: { content: string; onChange: (value: string) => void }) => (
    <textarea aria-label="rich-text-editor" value={content} onChange={(event) => onChange(event.target.value)} />
  ),
}));

// Fills every required field on the Armenian tab. Pass `skip` to leave one field empty so a
// test can prove that field is the sole blocker.
async function fillAllRequired(
  user: ReturnType<typeof userEvent.setup>,
  skip: Partial<Record<'location' | 'topics' | 'targetGroups' | 'dates', boolean>> = {},
) {
  await user.type(screen.getByLabelText('titleField', { exact: false }), 'A title');
  const editors = screen.getAllByLabelText('rich-text-editor');
  await user.type(editors[0], 'short');
  await user.type(editors[1], 'desc');
  await user.type(editors[2], 'access');
  if (!skip.location) await user.selectOptions(screen.getByLabelText('location'), 'region-1');
  if (!skip.topics) await user.click(screen.getByLabelText('Topic 1'));
  if (!skip.targetGroups) await user.click(screen.getByLabelText('TG 1'));
  if (!skip.dates) {
    fireEvent.change(screen.getByLabelText('startDate', { exact: false }), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('endDate', { exact: false }), { target: { value: '2026-12-31' } });
  }
}

describe('ServiceForm', () => {
  it('renders language selector at the top of the form card', () => {
    render(
      <ServiceForm
        showOrganisationField
        organisationOptions={[{ id: 'org-1', name: 'Organisation A' }]}
        isSubmitting={false}
        submitLabel="Save changes"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const languageLabel = screen.getByText('language');
    const organisationLabel = screen.getByText('organisation');
    const relation = languageLabel.compareDocumentPosition(organisationLabel);

    expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('opens on the Armenian tab by default', () => {
    render(
      <ServiceForm
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Create service"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    // The active tab carries the `bg-white ... shadow-sm` styling; the inactive one is muted.
    const armenianTab = screen.getByText('armenian');
    const englishTab = screen.getByText('english');
    expect(armenianTab.className).toContain('bg-white');
    expect(armenianTab.className).toContain('shadow-sm');
    expect(englishTab.className).not.toContain('bg-white');
  });

  it('renders the Armenian tab before the English tab', () => {
    render(
      <ServiceForm
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Create service"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const armenianTab = screen.getByText('armenian');
    const englishTab = screen.getByText('english');
    const relation = armenianTab.compareDocumentPosition(englishTab);
    expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('blocks submit when only the English title is filled (Armenian title is required)', () => {
    const onSubmit = vi.fn();
    render(
      <ServiceForm
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Create service"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    // Switch to English and fill ONLY the English title, leaving the Armenian title blank.
    fireEvent.click(screen.getByText('english'));
    fireEvent.change(screen.getByLabelText('titleField'), { target: { value: 'English only title' } });

    fireEvent.click(screen.getByText('Create service'));

    // Submit must still be blocked: validation requires the Armenian title (titleHy).
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('marks required fields with an asterisk', () => {
    render(
      <ServiceForm
        showOrganisationField
        organisationOptions={[{ id: 'org-1', name: 'Organisation A' }]}
        isSubmitting={false}
        submitLabel="Create service"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    // Opens on the Armenian tab, where the bilingual fields are required. The title input
    // label carries the asterisk inline; the custom labels carry it in a child span. Dates
    // are optional, so they have no asterisk.
    expect(screen.getByText('titleField *')).toBeInTheDocument();
    expect(screen.getByText('startDate')).toBeInTheDocument();
    expect(screen.getByText('startDate')).not.toHaveTextContent('*');
    expect(screen.getByText('location').closest('label')).toHaveTextContent('*');
    expect(screen.getByText('organisation').closest('label')).toHaveTextContent('*');
    expect(screen.getByText('topics').closest('label')).toHaveTextContent('*');
    expect(screen.getByText('targetGroups').closest('label')).toHaveTextContent('*');
  });

  it('shows an error summary box and blocks submit when required fields are empty', () => {
    const onSubmit = vi.fn();
    render(
      <ServiceForm
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Create service"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByText('Create service'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('errorSummaryTitle')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires a location even when every other field is filled', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ServiceForm
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Create service"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await fillAllRequired(user, { location: true });
    await user.click(screen.getByText('Create service'));
    expect(onSubmit).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText('location'), 'region-1');
    await user.click(screen.getByText('Create service'));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('offers "All regions" as a location and submits it as a null regionId', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ServiceForm
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Create service"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await fillAllRequired(user, { location: true });
    await user.selectOptions(screen.getByLabelText('location'), ALL_REGIONS);
    expect(screen.getByRole('option', { name: 'allRegions' })).toBeInTheDocument();
    await user.click(screen.getByText('Create service'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ regionId: null });
  });

  it('pre-selects "All regions" in edit mode when the service has no region', () => {
    render(
      <ServiceForm
        mode="edit"
        initialValues={{ ...EDIT_INITIAL, regionId: ALL_REGIONS }}
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Save changes"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('location')).toHaveValue(ALL_REGIONS);
  });

  it('requires topics and target groups but not dates', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ServiceForm
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Create service"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    // Everything except topics, target groups, and dates (dates stay empty throughout to
    // prove they are optional).
    await fillAllRequired(user, { topics: true, targetGroups: true, dates: true });
    await user.click(screen.getByText('Create service'));
    expect(onSubmit).not.toHaveBeenCalled();

    // Adding only topics + target groups — with both dates still empty — unblocks submit.
    await user.click(screen.getByLabelText('Topic 1'));
    await user.click(screen.getByLabelText('TG 1'));
    await user.click(screen.getByText('Create service'));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('clears an error as soon as the field becomes valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <ServiceForm
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Create service"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    // Submitting empty surfaces the inline Armenian-title error.
    await user.click(screen.getByText('Create service'));
    expect(screen.getByText('validation.titleRequired')).toBeInTheDocument();

    // Typing a valid title removes that error without a resubmit.
    await user.type(screen.getByLabelText('titleField', { exact: false }), 'A title');
    expect(screen.queryByText('validation.titleRequired')).not.toBeInTheDocument();
  });

  it('shows organisation only when configured', () => {
    const { rerender } = render(
      <ServiceForm
        showOrganisationField
        organisationOptions={[{ id: 'org-1', name: 'Organisation A' }]}
        isSubmitting={false}
        submitLabel="Save changes"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText('organisation')).toBeInTheDocument();

    rerender(
      <ServiceForm
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Create service"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByText('organisation')).not.toBeInTheDocument();
  });

  it('renders the "how to access the service" rich-text field', () => {
    render(
      <ServiceForm
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Create service"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText('howToAccessField')).toBeInTheDocument();
  });

  it('reveals a required organisation name field when "outside network" is checked', async () => {
    const user = userEvent.setup();
    render(
      <ServiceForm
        showOrganisationField
        allowExternalOrganisation
        organisationOptions={[{ id: 'org-1', name: 'Organisation A' }]}
        isSubmitting={false}
        submitLabel="Save changes"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    // Name field hidden until the box is checked; the org select is present.
    expect(screen.queryByText('organisationName')).not.toBeInTheDocument();
    expect(screen.getByText('selectOrganisation')).toBeInTheDocument();

    await user.click(screen.getByLabelText('outsideNetwork'));

    // Per the mockup the select stays (disabled) and the name field appears beside it.
    expect(screen.getByText('organisationName *')).toBeInTheDocument();
    const orgSelect = screen.getByRole('combobox', { name: 'organisation' }) as HTMLSelectElement;
    expect(orgSelect).toBeInTheDocument();
    expect(orgSelect.disabled).toBe(true);
  });

  it('submits externalOrganisationName without organisationId when outside network', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ServiceForm
        showOrganisationField
        allowExternalOrganisation
        organisationOptions={[{ id: 'org-1', name: 'Organisation A' }]}
        isSubmitting={false}
        submitLabel="Save changes"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByLabelText('outsideNetwork'));
    await user.type(screen.getByLabelText('organisationName', { exact: false }), 'Helping Hands');
    await fillAllRequired(user);

    await user.click(screen.getByText('Save changes'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        externalOrganisationName: 'Helping Hands',
        organisationId: undefined,
      }),
    );
  });

  it('shows a validation error when outside network is checked but name is blank', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <ServiceForm
        showOrganisationField
        allowExternalOrganisation
        organisationOptions={[{ id: 'org-1', name: 'Organisation A' }]}
        isSubmitting={false}
        submitLabel="Save changes"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByLabelText('outsideNetwork'));
    await user.click(screen.getByText('Save changes'));

    expect(screen.getByText('validation.organisationNameRequired')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears the organisation name and hides the field when "outside network" is unchecked', async () => {
    const user = userEvent.setup();
    render(
      <ServiceForm
        showOrganisationField
        allowExternalOrganisation
        organisationOptions={[{ id: 'org-1', name: 'Organisation A' }]}
        isSubmitting={false}
        submitLabel="Save changes"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const checkbox = screen.getByLabelText('outsideNetwork');
    await user.click(checkbox);
    await user.type(screen.getByLabelText('organisationName', { exact: false }), 'Helping Hands');
    expect(screen.getByLabelText('organisationName', { exact: false })).toHaveValue('Helping Hands');

    await user.click(checkbox); // uncheck
    expect(screen.queryByLabelText('organisationName')).not.toBeInTheDocument();

    await user.click(checkbox); // re-check — field should be empty again
    expect(screen.getByLabelText('organisationName', { exact: false })).toHaveValue('');
  });

  const EDIT_INITIAL: Partial<ServiceFormState> = {
    title: 'Old English title',
    titleHy: 'Հին վերնագիր',
    shortDescriptionHy: '<p>short hy</p>',
    descriptionHy: '<p>desc hy</p>',
    howToAccessHy: '<p>access hy</p>',
    regionId: 'region-1',
    topicIds: ['topic-1'],
    targetGroupIds: ['tg-1'],
    availabilityStart: '2026-01-01',
    availabilityEnd: '2026-12-31',
  };

  it('pre-populates fields from initialValues', () => {
    render(
      <ServiceForm
        mode="edit"
        initialValues={EDIT_INITIAL}
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Save changes"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    // Armenian tab is active by default, so the Armenian title is shown.
    expect(screen.getByLabelText('titleField', { exact: false })).toHaveValue('Հին վերնագիր');
  });

  it('clears an emptied English field with null in edit mode', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ServiceForm
        mode="edit"
        initialValues={EDIT_INITIAL}
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Save changes"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    // Switch to English and clear the (optional) English title.
    await user.click(screen.getByText('english'));
    await user.clear(screen.getByLabelText('titleField', { exact: false }));

    await user.click(screen.getByText('Save changes'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: null, titleHy: 'Հին վերնագիր' }),
    );
  });

  it('maps a server error back onto its field', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Title already exists'));
    const user = userEvent.setup();
    render(
      <ServiceForm
        showOrganisationField={false}
        isSubmitting={false}
        submitLabel="Create service"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await fillAllRequired(user);
    await user.click(screen.getByText('Create service'));

    expect(onSubmit).toHaveBeenCalled();
    // Surfaces both inline (under the title) and in the summary box.
    expect((await screen.findAllByText('Title already exists')).length).toBeGreaterThan(0);
  });
});
