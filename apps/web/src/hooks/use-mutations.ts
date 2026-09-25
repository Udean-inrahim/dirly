import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSensor,
  deleteSensor,
  resolveAlert,
  toggleSensor,
  updateSensor,
  updateSettings,
  queryKeys,
  type SensorInput,
  type SettingsInput,
} from '@/lib/queries';

export function useSensorMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.sensors }),
      queryClient.invalidateQueries({ queryKey: queryKeys.summary }),
    ]);

  return {
    create: useMutation({
      mutationFn: (input: SensorInput) => createSensor(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: SensorInput }) => updateSensor(id, input),
      onSuccess: invalidate,
    }),
    toggle: useMutation({
      mutationFn: (id: string) => toggleSensor(id),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteSensor(id),
      onSuccess: invalidate,
    }),
  };
}

export function useSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SettingsInput) => updateSettings(input),
    onSuccess: () =>
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.summary }),
      ]),
  });
}

export function useResolveAlertMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resolveAlert(id),
    onSuccess: () =>
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts('ACTIVE') }),
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts('ALL') }),
        queryClient.invalidateQueries({ queryKey: queryKeys.summary }),
      ]),
  });
}