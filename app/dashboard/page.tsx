import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateUniqueSlug } from '@/lib/slug';
import {
  approveTestimonialRequest,
  createMetric,
  createSection,
  createTestimonial,
  createWorkExample,
  deleteMetric,
  deleteSection,
  deleteTestimonial,
  deleteWorkExample,
  moveSection,
  rejectTestimonialRequest,
  updateMetric,
  updateTestimonial,
  updateWorkExample,
  uploadTestimonialAvatar,
  uploadWorkExampleImage
} from './actions';
import { ConfirmSubmitButton } from './ConfirmSubmitButton';
import { ProofPageForm } from './ProofPageForm';
import { PublicUrlControls } from './PublicUrlControls';
import { SubmitButton } from './SubmitButton';
import { Toast } from './Toast';

type ProofPage = {
  id: string;
  title: string;
  headline: string;
  bio: string | null;
  slug: string;
  status: 'draft' | 'published';
  theme: 'light' | 'dark';
  accent_color: string;
};

type ProofSection = {
  id: string;
  proof_page_id: string;
  type: 'testimonial' | 'work_example' | 'metric';
  position: number;
};

type Testimonial = {
  id: string;
  proof_section_id: string;
  name: string;
  role_company: string | null;
  quote: string;
  avatar_url: string | null;
};

type WorkExample = {
  id: string;
  proof_section_id: string;
  image_url: string | null;
  link_url: string | null;
  description: string;
  metric_text: string | null;
};

type Metric = {
  id: string;
  proof_section_id: string;
  label: string;
  value: string;
};

type TestimonialRequest = {
  id: string;
  proof_page_id: string;
  name: string;
  role_company: string | null;
  quote: string;
  avatar_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

async function signedUrl(supabase: ReturnType<typeof createServerSupabaseClient>, path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from('proof-media').createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function sectionLabel(type: ProofSection['type']) {
  if (type === 'work_example') return 'Work Example';
  if (type === 'testimonial') return 'Testimonial';
  return 'Metric';
}

async function ensureProofPage(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  email: string | null
): Promise<ProofPage> {
  const { data: existing } = await supabase
    .from('proof_pages')
    .select('id, title, headline, bio, slug, status, theme, accent_color')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return existing as ProofPage;
  }

  const title = email ?? 'My Proof';
  const slug = await generateUniqueSlug(supabase, email?.split('@')[0] || 'my-proof');

  const { data: created, error } = await supabase
    .from('proof_pages')
    .insert({
      user_id: userId,
      title,
      headline: 'Freelancer',
      slug,
      status: 'draft',
      theme: 'light'
    })
    .select('id, title, headline, bio, slug, status, theme, accent_color')
    .single();

  if (error || !created) {
    throw new Error(error?.message || 'Could not create proof page');
  }

  return created as ProofPage;
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { toast?: string | string[]; toastType?: string | string[] };
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const proofPage = await ensureProofPage(supabase, user.id, user.email ?? null);
  const toastMessage = getParam(searchParams?.toast);
  const toastType = getParam(searchParams?.toastType) === 'error' ? 'error' : 'success';

  const { data: sectionsData } = await supabase
    .from('proof_sections')
    .select('id, proof_page_id, type, position')
    .eq('proof_page_id', proofPage.id)
    .order('position', { ascending: true });

  const sections = (sectionsData ?? []) as ProofSection[];
  const sectionIds = sections.map((s) => s.id);

  const [{ data: testimonialRows }, { data: workExampleRows }, { data: metricRows }] = await Promise.all([
    sectionIds.length
      ? supabase
          .from('testimonials')
          .select('id, proof_section_id, name, role_company, quote, avatar_url')
          .in('proof_section_id', sectionIds)
      : Promise.resolve({ data: [] }),
    sectionIds.length
      ? supabase
          .from('work_examples')
          .select('id, proof_section_id, image_url, link_url, description, metric_text')
          .in('proof_section_id', sectionIds)
      : Promise.resolve({ data: [] }),
    sectionIds.length
      ? supabase.from('metrics').select('id, proof_section_id, label, value').in('proof_section_id', sectionIds)
      : Promise.resolve({ data: [] })
  ]);

  const testimonials = (testimonialRows ?? []) as Testimonial[];
  const workExamples = (workExampleRows ?? []) as WorkExample[];
  const metrics = (metricRows ?? []) as Metric[];

  const [{ data: pendingRequestRows }, { data: approvedRequestRows }] = await Promise.all([
    supabase
      .from('testimonial_requests')
      .select('id, proof_page_id, name, role_company, quote, avatar_url, status, created_at')
      .eq('proof_page_id', proofPage.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('testimonial_requests')
      .select('id, proof_page_id, name, role_company, quote, avatar_url, status, created_at')
      .eq('proof_page_id', proofPage.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
  ]);

  const pendingRequests = (pendingRequestRows ?? []) as TestimonialRequest[];
  const approvedRequests = (approvedRequestRows ?? []) as TestimonialRequest[];

  const avatarUrls = Object.fromEntries(
    await Promise.all(
      testimonials
        .filter((t) => Boolean(t.avatar_url))
        .map(async (t) => [t.id, await signedUrl(supabase, t.avatar_url)] as const)
    )
  );

  const imageUrls = Object.fromEntries(
    await Promise.all(
      workExamples
        .filter((w) => Boolean(w.image_url))
        .map(async (w) => [w.id, await signedUrl(supabase, w.image_url)] as const)
    )
  );

  const { count: viewCount } = await supabase
    .from('page_views')
    .select('id', { count: 'exact', head: true })
    .eq('proof_page_id', proofPage.id);

  return (
    <div className="space-y-6 pb-10">
      {toastMessage ? <Toast message={toastMessage} type={toastType} /> : null}

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-600">Manage your proof page content and publish when ready.</p>
        <PublicUrlControls slug={proofPage.slug} />
      </div>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Proof page settings</h2>
          {proofPage.status === 'published' ? (
            <span className="text-sm text-slate-600">Views: {viewCount ?? 0} (total)</span>
          ) : (
            <span className="text-sm text-slate-500">Publish to start tracking views.</span>
          )}
        </div>
        <ProofPageForm proofPage={proofPage} />
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Collect Testimonials</h2>
        <PublicUrlControls slug={proofPage.slug} pathPrefix="/r" label="Request Link" />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Pending requests</h3>
          {pendingRequests.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              No pending testimonials yet. Share your request link after a project completes.
            </p>
          ) : (
            pendingRequests.map((request) => (
              <article key={request.id} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{request.name}</p>
                  <p className="text-xs text-slate-500">{new Date(request.created_at).toLocaleString()}</p>
                </div>
                {request.role_company ? <p className="text-sm text-slate-600">{request.role_company}</p> : null}
                <p className="mt-2 text-sm text-slate-800">"{request.quote}"</p>
                <div className="mt-3 flex gap-2">
                  <form action={approveTestimonialRequest}>
                    <input type="hidden" name="request_id" value={request.id} />
                    <SubmitButton pendingText="Approving..." className="bg-brand-600 text-white hover:bg-brand-700">
                      Approve
                    </SubmitButton>
                  </form>
                  <form action={rejectTestimonialRequest}>
                    <input type="hidden" name="request_id" value={request.id} />
                    <SubmitButton pendingText="Rejecting..." className="border border-red-200 bg-white text-red-700 hover:bg-red-50">
                      Reject
                    </SubmitButton>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>

        <details className="rounded-lg border border-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Approved requests ({approvedRequests.length})
          </summary>
          <div className="mt-3 space-y-2">
            {approvedRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No approved requests yet.</p>
            ) : (
              approvedRequests.map((request) => (
                <article key={request.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{request.name}</p>
                    <p className="text-xs text-slate-500">{new Date(request.created_at).toLocaleString()}</p>
                  </div>
                  {request.role_company ? <p className="text-sm text-slate-600">{request.role_company}</p> : null}
                  <p className="mt-2 text-sm text-slate-800">"{request.quote}"</p>
                </article>
              ))
            )}
          </div>
        </details>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Sections</h2>

        <form action={createSection} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <input type="hidden" name="proof_page_id" value={proofPage.id} />
          <label className="space-y-1 text-sm">
            <span>Section type</span>
            <select name="type" defaultValue="testimonial">
              <option value="testimonial">Testimonial</option>
              <option value="work_example">Work Example</option>
              <option value="metric">Metric</option>
            </select>
            <p className="text-xs text-slate-500">Create one section at a time and reorder as needed.</p>
          </label>
          <SubmitButton pendingText="Adding section..." className="bg-brand-600 text-white hover:bg-brand-700">
            Add section
          </SubmitButton>
        </form>

        <div className="space-y-4">
          {sections.map((section) => {
            const sectionTestimonials = testimonials.filter((t) => t.proof_section_id === section.id);
            const sectionWorkExamples = workExamples.filter((w) => w.proof_section_id === section.id);
            const sectionMetrics = metrics.filter((m) => m.proof_section_id === section.id);

            return (
              <article key={section.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">{sectionLabel(section.type)}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">#{section.position}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={moveSection}>
                      <input type="hidden" name="section_id" value={section.id} />
                      <input type="hidden" name="direction" value="up" />
                      <SubmitButton
                        pendingText="Moving..."
                        className="border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                      >
                        ↑ Up
                      </SubmitButton>
                    </form>
                    <form action={moveSection}>
                      <input type="hidden" name="section_id" value={section.id} />
                      <input type="hidden" name="direction" value="down" />
                      <SubmitButton
                        pendingText="Moving..."
                        className="border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                      >
                        ↓ Down
                      </SubmitButton>
                    </form>
                    <form action={deleteSection}>
                      <input type="hidden" name="section_id" value={section.id} />
                      <ConfirmSubmitButton
                        pendingText="Deleting..."
                        confirmMessage="Delete this entire section and all its items? This cannot be undone."
                        className="border border-red-200 bg-white px-3 py-1.5 text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>

                {section.type === 'testimonial' ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Existing testimonials</h4>
                      {sectionTestimonials.map((testimonial) => (
                        <div key={testimonial.id} className="rounded-lg border border-slate-200 p-3">
                          <form action={updateTestimonial} className="space-y-2">
                            <input type="hidden" name="id" value={testimonial.id} />
                            <label className="space-y-1 text-sm">
                              <span>Name</span>
                              <input name="name" defaultValue={testimonial.name} required placeholder="Client name" />
                              <p className="text-xs text-slate-500">Who gave the testimonial.</p>
                            </label>
                            <label className="space-y-1 text-sm">
                              <span>Role / Company</span>
                              <input name="role_company" defaultValue={testimonial.role_company ?? ''} placeholder="CEO, Acme Inc." />
                            </label>
                            <label className="space-y-1 text-sm">
                              <span>Quote</span>
                              <textarea
                                name="quote"
                                rows={3}
                                defaultValue={testimonial.quote}
                                required
                                placeholder="A short, specific result-focused quote"
                              />
                            </label>
                            <SubmitButton pendingText="Saving..." className="bg-brand-600 text-white hover:bg-brand-700">
                              Save testimonial
                            </SubmitButton>
                          </form>

                          <form action={uploadTestimonialAvatar} className="mt-3 space-y-2">
                            <input type="hidden" name="testimonial_id" value={testimonial.id} />
                            <input type="hidden" name="proof_page_id" value={proofPage.id} />
                            <label className="space-y-1 text-sm">
                              <span>Avatar upload</span>
                              <input type="file" name="avatar" accept="image/*" required />
                              <p className="text-xs text-slate-500">Recommended square image for cleaner crop.</p>
                            </label>
                            <SubmitButton
                              pendingText="Uploading..."
                              className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            >
                              Upload avatar
                            </SubmitButton>
                          </form>

                          {avatarUrls[testimonial.id] ? (
                            <img
                              src={avatarUrls[testimonial.id] ?? ''}
                              alt={testimonial.name}
                              className="mt-3 h-14 w-14 rounded-full border border-slate-200 object-cover"
                            />
                          ) : null}

                          <form action={deleteTestimonial} className="mt-3">
                            <input type="hidden" name="id" value={testimonial.id} />
                            <ConfirmSubmitButton
                              pendingText="Deleting..."
                              confirmMessage="Delete this testimonial?"
                              className="border border-red-200 bg-white px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                            >
                              Delete testimonial
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      ))}
                    </div>

                    <details className="rounded-lg border border-slate-200 p-3">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700">Add new testimonial</summary>
                      {/* Keep create-form field names isolated from edit forms to prevent browser value carryover. */}
                      <form action={createTestimonial} className="mt-3 space-y-2" autoComplete="off">
                        <input type="hidden" name="proof_section_id" value={section.id} />
                        <label className="space-y-1 text-sm">
                          <span>Name</span>
                          <input name="new_name" required placeholder="Client name" autoComplete="off" />
                        </label>
                        <label className="space-y-1 text-sm">
                          <span>Role / Company</span>
                          <input name="new_role_company" placeholder="CEO, Acme Inc." autoComplete="off" />
                        </label>
                        <label className="space-y-1 text-sm">
                          <span>Quote</span>
                          <textarea
                            name="new_quote"
                            rows={3}
                            required
                            placeholder="What specific outcome did you deliver?"
                            autoComplete="off"
                          />
                        </label>
                        <p className="text-xs text-slate-500">This form clears after successful add.</p>
                        <SubmitButton pendingText="Adding..." className="bg-brand-600 text-white hover:bg-brand-700">
                          Add testimonial
                        </SubmitButton>
                      </form>
                    </details>
                  </div>
                ) : null}

                {section.type === 'work_example' ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Existing work examples</h4>
                      {sectionWorkExamples.map((work) => (
                        <div key={work.id} className="rounded-lg border border-slate-200 p-3">
                          <form action={updateWorkExample} className="space-y-2">
                            <input type="hidden" name="id" value={work.id} />
                            <label className="space-y-1 text-sm">
                              <span>Link URL</span>
                              <input name="link_url" defaultValue={work.link_url ?? ''} placeholder="https://example.com/project" />
                            </label>
                            <label className="space-y-1 text-sm">
                              <span>Description</span>
                              <textarea
                                name="description"
                                rows={3}
                                defaultValue={work.description}
                                required
                                placeholder="Explain project scope and what you achieved."
                              />
                            </label>
                            <label className="space-y-1 text-sm">
                              <span>Metric text</span>
                              <input
                                name="metric_text"
                                defaultValue={work.metric_text ?? ''}
                                placeholder="e.g., +42% conversion in 30 days"
                              />
                            </label>
                            <SubmitButton pendingText="Saving..." className="bg-brand-600 text-white hover:bg-brand-700">
                              Save work example
                            </SubmitButton>
                          </form>

                          <form action={uploadWorkExampleImage} className="mt-3 space-y-2">
                            <input type="hidden" name="work_example_id" value={work.id} />
                            <input type="hidden" name="proof_page_id" value={proofPage.id} />
                            <label className="space-y-1 text-sm">
                              <span>Image upload</span>
                              <input type="file" name="image" accept="image/*" required />
                              <p className="text-xs text-slate-500">Use a landscape screenshot for best 16:9 preview.</p>
                            </label>
                            <SubmitButton
                              pendingText="Uploading..."
                              className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            >
                              Upload image
                            </SubmitButton>
                          </form>

                          {imageUrls[work.id] ? (
                            <div className="mt-3 w-full max-w-[520px] overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                              <div className="aspect-video">
                                <img
                                  src={imageUrls[work.id] ?? ''}
                                  alt="Work example"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </div>
                          ) : null}

                          {imageUrls[work.id] ? (
                            <a
                              href={imageUrls[work.id] ?? ''}
                              target="_blank"
                              className="mt-2 inline-block text-xs text-brand-700 hover:underline"
                            >
                              Open full size
                            </a>
                          ) : null}

                          <form action={deleteWorkExample} className="mt-3">
                            <input type="hidden" name="id" value={work.id} />
                            <ConfirmSubmitButton
                              pendingText="Deleting..."
                              confirmMessage="Delete this work example?"
                              className="border border-red-200 bg-white px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                            >
                              Delete work example
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      ))}
                    </div>

                    <details className="rounded-lg border border-slate-200 p-3">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700">Add new work example</summary>
                      <form action={createWorkExample} className="mt-3 space-y-2" autoComplete="off">
                        <input type="hidden" name="proof_section_id" value={section.id} />
                        <label className="space-y-1 text-sm">
                          <span>Link URL</span>
                          <input name="new_link_url" placeholder="https://example.com/project" autoComplete="off" />
                        </label>
                        <label className="space-y-1 text-sm">
                          <span>Description</span>
                          <textarea
                            name="new_description"
                            rows={3}
                            required
                            placeholder="Describe the work and outcome."
                            autoComplete="off"
                          />
                        </label>
                        <label className="space-y-1 text-sm">
                          <span>Metric text</span>
                          <input name="new_metric_text" placeholder="e.g., Reduced churn by 15%" autoComplete="off" />
                        </label>
                        <p className="text-xs text-slate-500">Add either a link, an image upload, or both.</p>
                        <SubmitButton pendingText="Adding..." className="bg-brand-600 text-white hover:bg-brand-700">
                          Add work example
                        </SubmitButton>
                      </form>
                    </details>
                  </div>
                ) : null}

                {section.type === 'metric' ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Existing metrics</h4>
                      {sectionMetrics.map((metric) => (
                        <div key={metric.id} className="rounded-lg border border-slate-200 p-3">
                          <form action={updateMetric} className="space-y-2">
                            <input type="hidden" name="id" value={metric.id} />
                            <label className="space-y-1 text-sm">
                              <span>Label</span>
                              <input name="label" defaultValue={metric.label} required placeholder="e.g., Projects delivered" />
                            </label>
                            <label className="space-y-1 text-sm">
                              <span>Value</span>
                              <input name="value" defaultValue={metric.value} required placeholder="e.g., 120+" />
                            </label>
                            <SubmitButton pendingText="Saving..." className="bg-brand-600 text-white hover:bg-brand-700">
                              Save metric
                            </SubmitButton>
                          </form>

                          <form action={deleteMetric} className="mt-3">
                            <input type="hidden" name="id" value={metric.id} />
                            <ConfirmSubmitButton
                              pendingText="Deleting..."
                              confirmMessage="Delete this metric?"
                              className="border border-red-200 bg-white px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                            >
                              Delete metric
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      ))}
                    </div>

                    <details className="rounded-lg border border-slate-200 p-3">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700">Add new metric</summary>
                      <form action={createMetric} className="mt-3 space-y-2">
                        <input type="hidden" name="proof_section_id" value={section.id} />
                        <label className="space-y-1 text-sm">
                          <span>Label</span>
                          <input name="label" required placeholder="e.g., Avg. client retention" />
                        </label>
                        <label className="space-y-1 text-sm">
                          <span>Value</span>
                          <input name="value" required placeholder="e.g., 18 months" />
                        </label>
                        <p className="text-xs text-slate-500">Keep metric values specific and easy to scan.</p>
                        <SubmitButton pendingText="Adding..." className="bg-brand-600 text-white hover:bg-brand-700">
                          Add metric
                        </SubmitButton>
                      </form>
                    </details>
                  </div>
                ) : null}
              </article>
            );
          })}

          {sections.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              No sections yet. Add your first section above.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
