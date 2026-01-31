import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createIncident } from "@/services/incidents"
import { Environment, ErpModule } from "@/types/incident"
import type { CreateIncidentInput } from "@/types/incident"
import { Plus } from "lucide-react"

export const defaultForm: CreateIncidentInput = {
  title: "",
  description: "",
  erpModule: ErpModule.AP,
  environment: Environment.PROD,
  businessUnit: "",
}

export const NewIncidentDialog = () => {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [formState, setFormState] = useState<CreateIncidentInput>(defaultForm)

  const createMutation = useMutation({
    mutationFn: createIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] })
      setIsOpen(false)
      setFormState(defaultForm)
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          New Incident
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Incident</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formState.title}
              onChange={(event) =>
                setFormState({ ...formState, title: event.target.value })
              }
              placeholder="Short incident title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formState.description}
              onChange={(event) =>
                setFormState({ ...formState, description: event.target.value })
              }
              maxLength={5000}
              placeholder="Describe the issue in detail"
            />
            <div className="flex justify-end text-xs text-slate-500">
              {formState.description.length} / 5000 characters
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>ERP Module</Label>
              <Select
                value={formState.erpModule}
                onValueChange={(value) =>
                  setFormState({ ...formState, erpModule: value as ErpModule })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ErpModule).map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Environment</Label>
              <Select
                value={formState.environment}
                onValueChange={(value) =>
                  setFormState({ ...formState, environment: value as Environment })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Environment).map((env) => (
                    <SelectItem key={env} value={env}>
                      {env}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="businessUnit">Business Unit</Label>
            <Input
              id="businessUnit"
              value={formState.businessUnit ?? ""}
              onChange={(event) =>
                setFormState({ ...formState, businessUnit: event.target.value })
              }
              maxLength={500}
              placeholder="Optional"
            />
            <div className="flex justify-end text-xs text-slate-500">
              {(formState.businessUnit ?? "").length} / 500 characters
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button onClick={() => createMutation.mutate(formState)} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
