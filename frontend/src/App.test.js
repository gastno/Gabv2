import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StudioPage } from './pages/Gabbablu/Gabbablu';
import { brandApi, categoryApi, serviceApi, staffServiceApi } from './services/api';

jest.mock('./services/api', () => ({
  brandApi: { getAll: jest.fn() },
  categoryApi: { getAll: jest.fn() },
  serviceApi: { getAll: jest.fn() },
  staffServiceApi: { getByServiceId: jest.fn() },
  getAssetUrl: (path) => path ? `http://localhost:5000${path}` : null,
}));

beforeEach(() => {
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
  render(<StudioPage brandId={1} />);

  const serviceName = await screen.findByText('Classic Lashes');
  fireEvent.click(serviceName.closest('.service-row-item'));
  fireEvent.click(await screen.findByText('Artist One'));

  expect(screen.getByRole('heading', { name: 'Select Date & Time' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '15' }));
  fireEvent.click(screen.getByRole('button', { name: '10:30' }));
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
