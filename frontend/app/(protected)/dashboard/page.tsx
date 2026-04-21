
import { useMatchesQuery } from "@/hooks/use-matches";
import { useSavedPropertiesQuery, useSavePropertyMutation, useRemoveSavedPropertyMutation } from "@/hooks/use-saved-properties";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

  const { data, isLoading, isError } = useMatchesQuery();
  const { data: savedData } = useSavedPropertiesQuery();
  const saveMutation = useSavePropertyMutation();
  const removeMutation = useRemoveSavedPropertyMutation();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : isError ? (
          <p className="text-destructive">
            Failed to load matches. Please try again.
          </p>
        ) : !data?.items?.length ? (
          <p className="text-muted-foreground">
            Your matched properties will appear here.
          </p>
        ) : (
          <div
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            role="list"
            aria-label="Matched properties"
          >
            {data.items.map((match) => {
              const isSaved = savedData?.items.some(
                (item) => item.propertyId === match.propertyId
              );
              const isSaving = saveMutation.isLoading && saveMutation.variables?.propertyId === match.propertyId;
              const isUnsaving = removeMutation.isLoading && removeMutation.variables === match.propertyId;
              return (
                <Card
                  key={match.id}
                  tabIndex={0}
                  aria-label={`Matched property ${match.propertyId}`}
                  role="listitem"
                  className="focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
                >
                  <CardHeader>
                    <CardTitle>Matched Property</CardTitle>
                    <CardDescription>
                      Matched at: {new Date(match.matchedAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Placeholder for property details - to be replaced with real property info */}
                    <div className="font-semibold">
                      Property ID: {match.propertyId}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      Filter ID: {match.filterId}
                    </div>
                    <div className="mt-2">
                      <span className="font-medium">Reasons:</span> {match.matchReasons.join(", ")}
                    </div>
                    <div className="mt-4 flex gap-2 items-center">
                      <button
                        className="text-primary text-sm underline disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
                        disabled
                        tabIndex={0}
                        aria-label="View property listing (not yet implemented)"
                      >
                        View Listing
                      </button>
                      <button
                        className={
                          isSaved
                            ? "text-destructive text-xs underline disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-destructive focus:outline-none"
                            : "text-primary text-xs underline disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
                        }
                        disabled={isSaving || isUnsaving}
                        onClick={() => {
                          if (isSaved) {
                            removeMutation.mutate(match.propertyId);
                          } else {
                            saveMutation.mutate({ propertyId: match.propertyId });
                          }
                        }}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? "Unsave property" : "Save property"}
                        tabIndex={0}
                      >
                        {isSaved
                          ? isUnsaving
                            ? "Unsaving..."
                            : "Unsave"
                          : isSaving
                            ? "Saving..."
                            : "Save"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
