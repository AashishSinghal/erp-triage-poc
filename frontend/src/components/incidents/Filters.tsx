import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Environment, ErpModule } from "@/types/incident"
import { Filter, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type FiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  erpModule: ErpModule | ""
  onModuleChange: (value: ErpModule | "") => void
  environment: Environment | ""
  onEnvironmentChange: (value: Environment | "") => void
  sortBy: "createdAt" | "updatedAt"
  onSortByChange: (value: "createdAt" | "updatedAt") => void
  sortOrder: "asc" | "desc"
  onSortOrderChange: (value: "asc" | "desc") => void
  limit: number
  onLimitChange: (value: number) => void
  onClear: () => void
  resultCount: number
}

export const Filters = ({
  search,
  onSearchChange,
  erpModule,
  onModuleChange,
  environment,
  onEnvironmentChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  limit,
  onLimitChange,
  onClear,
  resultCount,
}: FiltersProps) => {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full min-w-0 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search incidents..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-[min(92vw,640px)] mx-2 sm:mx-0"
                onCloseAutoFocus={(event) => event.preventDefault()}
              >
                <div className="flex items-center justify-between">
                  <DropdownMenuLabel>Filters</DropdownMenuLabel>
                  <Button variant="ghost" size="sm" onClick={onClear}>
                    Clear all
                  </Button>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup className="pt-1 space-y-2">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Select value={erpModule} onValueChange={(value) => onModuleChange(value as ErpModule)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by module" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ErpModule).map((module) => (
                          <SelectItem key={module} value={module}>
                            {module}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={environment} onValueChange={(value) => onEnvironmentChange(value as Environment)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by environment" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Environment).map((env) => (
                          <SelectItem key={env} value={env}>
                            {env}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(value) => onSortByChange(value as "createdAt" | "updatedAt")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="updatedAt">Updated</SelectItem>
                        <SelectItem value="createdAt">Created</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Select value={sortOrder} onValueChange={(value) => onSortOrderChange(value as "asc" | "desc")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Newest first</SelectItem>
                        <SelectItem value="asc">Oldest first</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Limit" />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 25, 50, 100].map((size) => (
                          <SelectItem key={size} value={String(size)}>
                            {size} per page
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex h-10 items-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
                      {resultCount} incident{resultCount === 1 ? "" : "s"} shown
                    </div>
                  </div>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear all
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
