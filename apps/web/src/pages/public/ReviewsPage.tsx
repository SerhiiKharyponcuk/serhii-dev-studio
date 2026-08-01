import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { api } from "../../lib/api";
import { EmptyState, ErrorState, LoadingState } from "../../components/AsyncState";
import { useI18n } from "../../i18n/I18nProvider";

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
  const { t } = useI18n();
  const query = useQuery({
    queryKey: ["public-reviews"],
    queryFn: async () => (await api.get<{ data: Review[] }>("/reviews")).data.data
  });
  return (
    <section className="section">
      <div className="shell text-center">
        <p className="eyebrow">{t("Client reviews")}</p>
        <h1 className="section-title mt-4">{t("Feedback from completed work.")}</h1>
        <p className="muted mx-auto mt-5 max-w-2xl">
          {t(
            "Reviews are published only after the related project is completed and the feedback is moderated."
          )}
        </p>
      </div>
      <div className="shell mt-12 grid-auto">
        {query.isPending ? (
          <LoadingState title="Loading client reviews" />
        ) : query.isError ? (
          <ErrorState
            title="Unable to load reviews"
            description="Please refresh the page or try again in a moment."
          />
        ) : query.data?.length ? (
          query.data.map((review) => (
            <article className="glass card" key={review.id}>
              <div
                className="flex gap-1 text-amber-300"
                aria-label={`${review.rating} ${t("out of 5 stars")}`}
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
          <EmptyState
            title="No published reviews yet"
            description="Verified client feedback will appear here after moderation."
          />
        )}
      </div>
    </section>
  );
}
