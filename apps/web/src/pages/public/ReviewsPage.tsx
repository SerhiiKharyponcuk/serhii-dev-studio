import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { api } from "../../lib/api";

type Review = {
  id: string;
  rating: number;
  title: string;
  message: string;
  clientName: string;
  createdAt: string;
  project: { name: string };
};

export function ReviewsPage() {
  const query = useQuery({
    queryKey: ["public-reviews"],
    queryFn: async () => (await api.get<{ data: Review[] }>("/reviews")).data.data
  });
  return (
    <section className="section">
      <div className="shell text-center">
        <p className="eyebrow">Client reviews</p>
        <h1 className="section-title mt-4">Feedback from completed work.</h1>
        <p className="muted mx-auto mt-5 max-w-2xl">
          Reviews are published only after the related project is completed and the feedback is
          moderated.
        </p>
      </div>
      <div className="shell mt-12 grid-auto">
        {query.isPending ? (
          <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
        ) : query.isError ? (
          <div className="glass card text-red-200">Reviews could not be loaded.</div>
        ) : query.data?.length ? (
          query.data.map((review) => (
            <article className="glass card" key={review.id}>
              <div
                className="flex gap-1 text-amber-300"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {Array.from({ length: review.rating }, (_, index) => (
                  <Star key={index} size={16} fill="currentColor" />
                ))}
              </div>
              <h2 className="mt-5 text-lg font-bold">{review.title}</h2>
              <p className="muted mt-3 text-sm leading-6">{review.message}</p>
              <p className="mt-5 text-sm font-semibold">
                {review.clientName}
                <span className="muted ml-2 font-normal">· {review.project.name}</span>
              </p>
            </article>
          ))
        ) : (
          <div className="glass card">
            <h2 className="font-bold">No published reviews yet</h2>
            <p className="muted mt-2 text-sm">
              Verified client feedback will appear here after moderation.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
