/**
 * ScalabilityRuntimeCapabilities — capacidades declarativas (INF-10).
 *
 * Apenas declaração estrutural. Sem backends de escalabilidade reais.
 * Sem Kubernetes / Docker Swarm / Azure Scale Set / HPA / Auto Scaling.
 * Sem Cluster / Load Balancer / Failover / Sharding / Partitioning.
 * Sem Horizontal/Vertical Scaling / Node Management / HA / Elastic Scaling / Capacity Planning reais.
 */

import type { CanonicalScalabilityCapabilities } from "./canonical";

export type ScalabilityRuntimeCapabilities = {
  supportsRegister?: boolean;
  supportsUnregister?: boolean;
  supportsObserve?: boolean;
  supportsRelease?: boolean;
  supportsList?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalScalability?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesQueueRuntimePort?: boolean;
  usesWorkerRuntimePort?: boolean;
  usesSchedulerRuntimePort?: boolean;
  usesPersistentQueueRuntimePort?: boolean;
  usesObservabilityRuntimePort?: boolean;
  usesTISSRuntimePort?: boolean;
  runtimeReady?: true;
  realScalabilityBackend?: false;
  kubernetesImplemented?: false;
  dockerSwarmImplemented?: false;
  azureScaleSetImplemented?: false;
  horizontalPodAutoscalerImplemented?: false;
  autoScalingImplemented?: false;
  clusterImplemented?: false;
  loadBalancerImplemented?: false;
  failoverImplemented?: false;
  shardingImplemented?: false;
  partitioningImplemented?: false;
  horizontalScalingImplemented?: false;
  verticalScalingImplemented?: false;
  nodeManagementImplemented?: false;
  highAvailabilityImplemented?: false;
  elasticScalingImplemented?: false;
  capacityPlanningImplemented?: false;
  realScalabilityOrchestrationImplemented?: false;
  realDistributedProcessingImplemented?: false;
  realExternalIntegrationImplemented?: false;
  implementsKubernetes?: false;
  implementsDockerSwarm?: false;
  implementsAzureScaleSet?: false;
  implementsHorizontalPodAutoscaler?: false;
  implementsAutoScaling?: false;
  implementsCluster?: false;
  implementsLoadBalancer?: false;
  implementsFailover?: false;
  implementsSharding?: false;
  implementsPartitioning?: false;
  implementsHorizontalScaling?: false;
  implementsVerticalScaling?: false;
  implementsNodeManagement?: false;
  implementsHighAvailability?: false;
  implementsElasticScaling?: false;
  implementsCapacityPlanning?: false;
  implementsRealScalabilityOrchestration?: false;
  implementsRealDistributedProcessing?: false;
  implementsRealExternalIntegration?: false;
  implementsRealScalabilityBackend?: false;
  implementsHttp?: false;
  implementsWebsocket?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyScalabilityRuntimeCapabilities(): ScalabilityRuntimeCapabilities {
  return {};
}

export function defineScalabilityRuntimeCapabilities(
  capabilities: ScalabilityRuntimeCapabilities = {},
): ScalabilityRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES: ScalabilityRuntimeCapabilities = {
  supportsRegister: true,
  supportsUnregister: true,
  supportsObserve: true,
  supportsRelease: true,
  supportsList: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalScalability: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesQueueRuntimePort: true,
  usesWorkerRuntimePort: true,
  usesSchedulerRuntimePort: true,
  usesPersistentQueueRuntimePort: true,
  usesObservabilityRuntimePort: true,
  usesTISSRuntimePort: true,
  runtimeReady: true,
  realScalabilityBackend: false,
  kubernetesImplemented: false,
  dockerSwarmImplemented: false,
  azureScaleSetImplemented: false,
  horizontalPodAutoscalerImplemented: false,
  autoScalingImplemented: false,
  clusterImplemented: false,
  loadBalancerImplemented: false,
  failoverImplemented: false,
  shardingImplemented: false,
  partitioningImplemented: false,
  horizontalScalingImplemented: false,
  verticalScalingImplemented: false,
  nodeManagementImplemented: false,
  highAvailabilityImplemented: false,
  elasticScalingImplemented: false,
  capacityPlanningImplemented: false,
  realScalabilityOrchestrationImplemented: false,
  realDistributedProcessingImplemented: false,
  realExternalIntegrationImplemented: false,
  implementsKubernetes: false,
  implementsDockerSwarm: false,
  implementsAzureScaleSet: false,
  implementsHorizontalPodAutoscaler: false,
  implementsAutoScaling: false,
  implementsCluster: false,
  implementsLoadBalancer: false,
  implementsFailover: false,
  implementsSharding: false,
  implementsPartitioning: false,
  implementsHorizontalScaling: false,
  implementsVerticalScaling: false,
  implementsNodeManagement: false,
  implementsHighAvailability: false,
  implementsElasticScaling: false,
  implementsCapacityPlanning: false,
  implementsRealScalabilityOrchestration: false,
  implementsRealDistributedProcessing: false,
  implementsRealExternalIntegration: false,
  implementsRealScalabilityBackend: false,
  implementsHttp: false,
  implementsWebsocket: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

export const DEFAULT_MOCK_SCALABILITY_RUNTIME_CAPABILITIES: ScalabilityRuntimeCapabilities = {
  ...DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES,
};

export function toCanonicalScalabilityCapabilities(
  capabilities: ScalabilityRuntimeCapabilities = DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES,
): CanonicalScalabilityCapabilities {
  return {
    kind: "canonical-scalability-capabilities",
    supportsRegister: capabilities.supportsRegister === true,
    supportsUnregister: capabilities.supportsUnregister === true,
    supportsObserve: capabilities.supportsObserve === true,
    supportsRelease: capabilities.supportsRelease === true,
    supportsList: capabilities.supportsList === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalScalability: capabilities.supportsCanonicalScalability === true,
    runtimeReady: true,
    realScalabilityBackend: false,
    kubernetesImplemented: false,
    dockerSwarmImplemented: false,
    azureScaleSetImplemented: false,
    horizontalPodAutoscalerImplemented: false,
    autoScalingImplemented: false,
    clusterImplemented: false,
    loadBalancerImplemented: false,
    failoverImplemented: false,
    shardingImplemented: false,
    partitioningImplemented: false,
    horizontalScalingImplemented: false,
    verticalScalingImplemented: false,
    nodeManagementImplemented: false,
    highAvailabilityImplemented: false,
    elasticScalingImplemented: false,
    capacityPlanningImplemented: false,
    realScalabilityOrchestrationImplemented: false,
    realDistributedProcessingImplemented: false,
    realExternalIntegrationImplemented: false,
    implementsKubernetes: false,
    implementsDockerSwarm: false,
    implementsAzureScaleSet: false,
    implementsHorizontalPodAutoscaler: false,
    implementsAutoScaling: false,
    implementsCluster: false,
    implementsLoadBalancer: false,
    implementsFailover: false,
    implementsSharding: false,
    implementsPartitioning: false,
    implementsHorizontalScaling: false,
    implementsVerticalScaling: false,
    implementsNodeManagement: false,
    implementsHighAvailability: false,
    implementsElasticScaling: false,
    implementsCapacityPlanning: false,
    implementsRealScalabilityOrchestration: false,
    implementsRealDistributedProcessing: false,
    implementsRealExternalIntegration: false,
    implementsRealScalabilityBackend: false,
    implementsHttp: false,
    implementsWebsocket: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
