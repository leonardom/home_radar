import {
  useFiltersQuery,
  useCreateFilterMutation,
  useDeleteFilterMutation,
  useUpdateFilterMutation,
} from "@/hooks/use-filters";
import { FilterForm } from "@/components/filters/FilterForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useState } from "react";

  const { data, isLoading, isError } = useFiltersQuery();
  const createMutation = useCreateFilterMutation();
  const deleteMutation = useDeleteFilterMutation();
  const updateMutation = useUpdateFilterMutation();
  const toastRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Show toast for create/delete/update success/error
  useEffect(() => {
    if (
      createMutation.isSuccess ||
      createMutation.isError ||
      deleteMutation.isSuccess ||
      deleteMutation.isError ||
      updateMutation.isSuccess ||
      updateMutation.isError
    ) {
      toastRef.current?.classList.remove("hidden");
      const timeout = setTimeout(() => {
        toastRef.current?.classList.add("hidden");
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [
    createMutation.isSuccess,
    createMutation.isError,
    deleteMutation.isSuccess,
    deleteMutation.isError,
    updateMutation.isSuccess,
    updateMutation.isError,
  ]);

  // Detect backend 409 error for minimum filter constraint
  const createErrorMsg =
    createMutation.error &&
    typeof createMutation.error === "object" &&
    "message" in createMutation.error &&
    (createMutation.error as any).message?.includes("minimum filter")
      ? "You must have at least one filter."
      : "Failed to create filter. Please check your input.";
  const updateErrorMsg =
    updateMutation.error &&
    typeof updateMutation.error === "object" &&
    "message" in updateMutation.error &&
    (updateMutation.error as any).message?.includes("minimum filter")
      ? "You must have at least one filter."
      : "Failed to update filter. Please check your input.";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Filters</h1>
      {/* Toast feedback */}
      <div
        ref={toastRef}
        className="bg-background fixed top-6 left-1/2 z-50 hidden -translate-x-1/2 rounded border px-4 py-2 shadow-lg"
        aria-live="polite"
      >
        {createMutation.isSuccess && <span className="text-success">Filter created!</span>}
        {createMutation.isError && <span className="text-destructive">{createErrorMsg}</span>}
        {updateMutation.isSuccess && <span className="text-success">Filter updated!</span>}
        {updateMutation.isError && <span className="text-destructive">{updateErrorMsg}</span>}
        {deleteMutation.isSuccess && <span className="text-success">Filter deleted!</span>}
        {deleteMutation.isError && <span className="text-destructive">Failed to delete filter.</span>}
      </div>

      <div className="mt-4 mb-8">
        <h2 className="mb-2 text-lg font-semibold">Create New Filter</h2>
        <FilterForm onSubmit={(values) => createMutation.mutate(values)} />
      </div>
      <h2 className="mb-2 text-lg font-semibold">Your Filters</h2>
      <div>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : isError ? (
          <p className="text-destructive">Failed to load filters.</p>
        ) : !data?.items?.length ? (
          <div>
            <p className="text-muted-foreground">
              No filters found. Create your first filter above!
            </p>
            <div className="text-muted-foreground mt-2 text-xs">
              Filters help you find properties that match your preferences.
              Create one to get started!
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.items.map((filter) => (
              <Card key={filter.id}>
                <CardHeader>
                  <CardTitle>Filter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground mb-2 text-xs">ID: {filter.id}</div>
                  {editingId === filter.id ? (
                    <FilterForm
                      defaultValues={filter}
                      onSubmit={(values) => {
                        updateMutation.mutate({ id: filter.id, payload: values });
                        setEditingId(null);
                      }}
                    />
                  ) : (
                    <>
                      <div>Price: {filter.priceMin ?? "-"} to {filter.priceMax ?? "-"}</div>
                      <div>Bedrooms: {filter.bedroomsMin ?? "-"} to {filter.bedroomsMax ?? "-"}</div>
                      <div>Bathrooms: {filter.bathroomsMin ?? "-"} to {filter.bathroomsMax ?? "-"}</div>
                      <div>Location: {filter.location || "-"}</div>
                      <div>Type: {filter.propertyType || "-"}</div>
                      <div>Keywords: {filter.keywords?.join(", ") || "-"}</div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(filter.id)}
                          disabled={editingId !== null}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteMutation.isLoading && deleteMutation.variables === filter.id}
                          onClick={() => deleteMutation.mutate(filter.id)}
                        >
                          {deleteMutation.isLoading && deleteMutation.variables === filter.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
