import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import StudioPage from './StudioPage';
import { LanguageProvider } from '../../components/i18n/LanguageContext';
import {
  apptApi,
  brandApi,
  brandPortfolioApi,
  categoryApi,
  serviceApi,
  staffServiceApi,
} from '../../services/api';

jest.mock("react-router-dom", () => {
  const React = require("react");
  return {
    Link: ({ to, children, ...props }) =>
      React.createElement("a", { href: to, ...props }, children),
  };
});

jest.mock('../../services/api', () => ({
  apptApi: { createAppointment: jest.fn(), getAvailability: jest.fn() },
  brandApi: { getAll: jest.fn() },
  brandPortfolioApi: { get: jest.fn() },
  categoryApi: { getAll: jest.fn() },
  serviceApi: { getAll: jest.fn() },
  staffServiceApi: { getByServiceId: jest.fn() },
  getAssetUrl: (path) => path ? `http://localhost:5000${path}` : null,
  getLocalizedValue: (record, field, language = 'en') =>
    record?.[`${field}_${language}`] || record?.[`${field}_en`] || record?.[field] || '',
}));

beforeEach(() => {
  localStorage.removeItem('site_language');
  apptApi.createAppointment.mockResolvedValue({ appointment: { id: 1 } });
  brandPortfolioApi.get.mockResolvedValue(null);
  brandApi.getAll.mockResolvedValue([
    { id: 1, name: 'Gabbablu', location: 'Gabbablu address', about_description: 'Gabbablu about' },
    { id: 2, name: 'Amor Tattoo', location: 'Tattoo address', about_description: 'Tattoo about' },
  ]);
  categoryApi.getAll.mockResolvedValue([
    { id: 11, brand_id: 1, title: 'Lashes', subtitle: 'Lash services' },
    { id: 22, brand_id: 2, title: 'Tattoo', subtitle: 'Tattoo services' },
  ]);
  serviceApi.getAll.mockResolvedValue([
    { id: 101, brand_id: 1, category_id: 11, name: 'Classic Lashes', duration: '90 min', price: '14,000 kr' },
    { id: 202, brand_id: 2, category_id: 22, name: 'Custom Tattoo', duration: '120 min', price: '20,000 kr' },
  ]);
  staffServiceApi.getByServiceId.mockResolvedValue([
    { id: 7, name: 'Artist One', description: 'Tattoo artist', avatar_url: '/uploads/artist.webp' },
  ]);
  apptApi.getAvailability.mockResolvedValue({
    slots: [
      { staff_id: 7, staff_name: 'Artist One', start_time: '2099-01-01T09:00:00.000Z', end_time: '2099-01-01T10:30:00.000Z' },
      { staff_id: 7, staff_name: 'Artist One', start_time: '2099-01-01T11:00:00.000Z', end_time: '2099-01-01T12:30:00.000Z' },
    ],
  });

});

test('loads brand 2 details and only its categories and services', async () => {
  render(<StudioPage brandId={2} />);

  expect(await screen.findByText('Custom Tattoo')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Amor Tattoo' })).toBeInTheDocument();
  expect(screen.getByText(/Tattoo address/)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Tattoo' })).toBeInTheDocument();
  expect(screen.queryByText('Classic Lashes')).not.toBeInTheDocument();
});

test('loads team profiles from the selected service assignments', async () => {
  render(<StudioPage brandId={1} />);

  expect(await screen.findByText('Classic Lashes')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Our Team' }));

  expect(await screen.findByRole('heading', { name: 'Artist One' })).toBeInTheDocument();
  expect(screen.getByText('Tattoo artist')).toBeInTheDocument();
  await waitFor(() => expect(staffServiceApi.getByServiceId).toHaveBeenCalledWith(101));
});

test('booking progress supports forward and backward navigation', async () => {
  const { container } = render(<StudioPage brandId={1} />);

  const serviceName = await screen.findByText('Classic Lashes');
  fireEvent.click(serviceName.closest('.service-row-item'));
  fireEvent.click(await screen.findByText('Artist One'));

  expect(screen.getByRole('heading', { name: 'Select Date & Time' })).toBeInTheDocument();
  await waitFor(() => expect(apptApi.getAvailability).toHaveBeenCalled());
  const availableDay = await waitFor(() => {
    const day = container.querySelector('.calendar-day-cell.available');
    expect(day).toBeTruthy();
    return day;
  });
  fireEvent.click(availableDay);
  const timeChip = await waitFor(() => {
    const chip = container.querySelector('.time-chip');
    expect(chip).toBeTruthy();
    return chip;
  });
  fireEvent.click(timeChip);
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue as Guest' }));

  expect(screen.getByRole('heading', { name: 'Customer Information' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Full Name *'), { target: { value: 'Birta Helgadóttir' } });
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('heading', { name: 'Booking Details' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Continue as Guest' }));
  expect(screen.getByLabelText('Full Name *')).toHaveValue('Birta Helgadóttir');
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));

  fireEvent.click(screen.getByRole('button', { name: 'Step 2: Date & time' }));
  expect(screen.getByRole('heading', { name: 'Select Date & Time' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('heading', { name: 'Choose an employee' })).toBeInTheDocument();
});

test("requires cancellation policy acceptance and stores it with the appointment", async () => {
  jest.spyOn(window, "alert").mockImplementation(() => {});
  render(<StudioPage brandId={1} />);

  fireEvent.click((await screen.findByText("Classic Lashes")).closest(".service-row-item"));
  fireEvent.click(await screen.findByText("Artist One"));
  await screen.findByRole("heading", { name: "Select Date & Time" });

  const availableDay = await waitFor(() => {
    const day = document.querySelector(".calendar-day-cell.available");
    expect(day).toBeTruthy();
    return day;
  });

  fireEvent.click(availableDay);
  const timeChip = await waitFor(() => {
    const chip = document.querySelector(".time-chip");
    expect(chip).toBeTruthy();
    return chip;
  });
  fireEvent.click(timeChip);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));

  fireEvent.change(screen.getByLabelText("Full Name *"), { target: { value: "Birta Helgadóttir" } });
  fireEvent.change(screen.getByLabelText("Email *"), { target: { value: "birta@example.com" } });
  fireEvent.change(screen.getByLabelText("Phone Number *"), { target: { value: "1234567" } });
  fireEvent.change(screen.getByLabelText("Kennitala *"), { target: { value: "1234567890" } });
  fireEvent.click(screen.getByLabelText(/I consent to Gabbablu storing and processing/));

  fireEvent.click(screen.getByRole("button", { name: "Confirm & Book Appointment" }));
  expect(apptApi.createAppointment).not.toHaveBeenCalled();

  fireEvent.click(screen.getByLabelText(/I have read and accept the cancellation and no-show policy/));
  fireEvent.click(screen.getByRole("button", { name: "Confirm & Book Appointment" }));

  await waitFor(() => {
    expect(apptApi.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        consent_privacy: true,
        custom_options: {
          cancellation_policy_accepted: true,
          cancellation_policy_version: "2026-10-19",
        },
      })
    );
  });
});

test('renders Icelandic database content and translated studio labels when Icelandic is selected', async () => {
  staffServiceApi.getByServiceId.mockResolvedValue([
    {
      id: 7,
      name: 'Artist One',
      description_en: 'Tattoo artist',
      description_is: 'Húðflúrari',
      avatar_url: '/uploads/artist.webp',
    },
  ]);
  categoryApi.getAll.mockResolvedValue([
    {
      id: 11,
      brand_id: 1,
      name_en: 'Lashes',
      name_is: 'Augnhár',
      description_en: 'Lash services',
      description_is: 'Augnháraþjónusta',
    },
  ]);
  serviceApi.getAll.mockResolvedValue([
    {
      id: 101,
      brand_id: 1,
      category_id: 11,
      name_en: 'Classic Lashes',
      name_is: 'Klassísk augnhár',
      description_en: 'A classic lash treatment',
      description_is: 'Klassísk augnhárameðferð',
      duration_minutes: 90,
      duration: '90 min',
      price_isk: 14000,
      price: '14,000 kr',
    },
  ]);

  await act(async () => {
    render(<LanguageProvider><StudioPage brandId={1} /></LanguageProvider>);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  expect(await screen.findByText('Classic Lashes')).toBeInTheDocument();
  await act(async () => {
    fireEvent.change(screen.getByRole('combobox', { name: 'Select language' }), {
      target: { value: 'is' },
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(await screen.findByText('Klassísk augnhár')).toBeInTheDocument();
  expect(screen.getByText('Klassísk augnhárameðferð')).toBeInTheDocument();
  expect(screen.getByText(/90 mín/)).toBeInTheDocument();
  expect(screen.getByText('14.000 kr.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Þjónusta' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Þjónustan okkar' })).toBeInTheDocument();
  expect(screen.getByText('Augnháraþjónusta')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Teymið okkar' }));
  expect(await screen.findByText('Húðflúrari')).toBeInTheDocument();
});
