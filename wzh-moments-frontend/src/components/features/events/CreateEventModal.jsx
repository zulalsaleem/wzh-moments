import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import endpoints from '../../../api/endpoints';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';
import ImageUpload from '../../common/ImageUpload';
import { EVENT_CATEGORIES } from '../../../utils/constants';

export default function CreateEventModal({ isOpen, onClose, onCreated }) {
  const [timelineTasks, setTimelineTasks] = useState([{ task: '', description: '' }]);
  const [vendorReqs, setVendorReqs] = useState([]);
  const [createdEventId, setCreatedEventId] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { ticketPrice: 0 },
  });

  const addTask = () => setTimelineTasks((p) => [...p, { task: '', description: '' }]);
  const removeTask = (i) => setTimelineTasks((p) => p.filter((_, idx) => idx !== i));
  const updateTask = (i, field, val) =>
    setTimelineTasks((p) => p.map((t, idx) => (idx === i ? { ...t, [field]: val } : t)));

  const addVendorReq = () => setVendorReqs((p) => [...p, '']);
  const removeVendorReq = (i) => setVendorReqs((p) => p.filter((_, idx) => idx !== i));
  const updateVendorReq = (i, val) => setVendorReqs((p) => p.map((v, idx) => (idx === i ? val : v)));

  const handleClose = () => {
    reset();
    setTimelineTasks([{ task: '', description: '' }]);
    setVendorReqs([]);
    setCreatedEventId(null);
    setCoverImage(null);
    onClose();
  };

  const onSubmit = async (data) => {
    const timeline = timelineTasks.filter((t) => t.task.trim());
    if (timeline.length === 0) {
      toast.error('Add at least one timeline task');
      return;
    }

    try {
      const res = await api.post(endpoints.events.create, {
        title: data.title,
        description: data.description,
        date: data.date,
        location: data.location,
        category: data.category,
        maxAttendees: Number(data.maxAttendees) || 50,
        ticketPrice: Number(data.ticketPrice) || 0,
        timeline,
        vendorRequirements: vendorReqs.filter((v) => v.trim()),
        tags: data.tags
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      });
      const eventId = res.data.event?._id ?? res.data.event?.id;
      toast.success('Event created! Add a cover photo or click Done.');
      setCreatedEventId(eventId);
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  // Cover photo step — shown after event is successfully created
  if (createdEventId) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Add Cover Photo" size="lg">
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              Event created successfully! Optionally add a cover photo below.
            </p>
          </div>

          <ImageUpload
            currentImage={coverImage}
            uploadEndpoint={endpoints.upload.eventCover(createdEventId)}
            fieldName="coverImage"
            aspectRatio="video"
            label="Event Cover Photo"
            hint="Recommended: 1200×600px — JPG, PNG, WebP up to 5MB"
            onUploadSuccess={(data) => setCoverImage(data.coverImage)}
          />

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Event" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic info */}
        <Input
          label="Event Title"
          placeholder="My Amazing Event"
          error={errors.title?.message}
          {...register('title', { required: 'Title is required' })}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Describe your event..."
            {...register('description', { required: 'Description is required' })}
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date & Time"
            type="datetime-local"
            error={errors.date?.message}
            {...register('date', { required: 'Date is required' })}
          />
          <Input
            label="Location"
            placeholder="Venue, City"
            {...register('location')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              {...register('category')}
            >
              {EVENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="Max Attendees"
            type="number"
            min="1"
            placeholder="50"
            error={errors.maxAttendees?.message}
            {...register('maxAttendees', { required: 'Required', min: { value: 1, message: 'At least 1' } })}
          />
          <Input
            label="Ticket Price (PKR)"
            type="number"
            min="0"
            placeholder="0 for free"
            {...register('ticketPrice')}
          />
        </div>

        <Input
          label="Tags (comma-separated)"
          placeholder="music, outdoor, family"
          {...register('tags')}
        />

        {/* Timeline tasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Timeline / Tasks</label>
            <button
              type="button"
              onClick={addTask}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add task
            </button>
          </div>
          <div className="space-y-2">
            {timelineTasks.map((t, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    value={t.task}
                    onChange={(e) => updateTask(i, 'task', e.target.value)}
                    placeholder={`Task ${i + 1}`}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    value={t.description}
                    onChange={(e) => updateTask(i, 'description', e.target.value)}
                    placeholder="Description (optional)"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                {timelineTasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask(i)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vendor requirements */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Vendor Requirements <span className="text-gray-400 font-normal">(optional)</span></label>
            <button
              type="button"
              onClick={addVendorReq}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {vendorReqs.length > 0 && (
            <div className="space-y-2">
              {vendorReqs.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={v}
                    onChange={(e) => updateVendorReq(i, e.target.value)}
                    placeholder={`e.g. Catering, Photography`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeVendorReq(i)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Button variant="secondary" type="button" onClick={handleClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Create Event</Button>
        </div>
      </form>
    </Modal>
  );
}
