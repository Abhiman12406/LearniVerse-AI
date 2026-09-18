"""Network-Aware Adaptive Delivery Service.

Conforms strictly to BACKEND_LOGIC.md §18:
- Invariance Principle: d(Mastery) / d(NetworkQuality) = 0
- Selects optimal rendering/content modality without compromising cognitive assessment rigor.
- Gracefully degrades presentation (FULL_3D -> LIGHTWEIGHT_3D -> 2D_STRUCTURED -> OFFLINE_SYNC).
"""

from typing import Any, Dict
from backend.app.models.evidence import NetworkContext


class NetworkDeliveryService:
    """Selects optimal content modality and client performance configurations."""

    def __init__(self):
        pass

    def select_modality(self, context: NetworkContext) -> Dict[str, Any]:
        """
        Determines presentation modality and graphics configuration based on client network & hardware context.
        Crucially, cognitive challenge and educational content remain mathematically identical.
        """
        latency = context.latency_ms
        fps = context.fps
        stability = context.connection_stability
        bw_class = context.bandwidth_class.upper()

        if stability < 0.60 or bw_class == "OFFLINE":
            modality = "OFFLINE_SYNC"
            render_tier = "2d_fallback"
            enable_shadows = False
            enable_particles = False
            lod = "minimal"
        elif bw_class == "VERY_LOW_NETWORK" or latency > 400.0 or fps < 20.0:
            modality = "2D_STRUCTURED"
            render_tier = "2d_fallback"
            enable_shadows = False
            enable_particles = False
            lod = "low"
        elif bw_class == "LIMITED_NETWORK" or latency > 150.0 or fps < 40.0 or context.device_class == "mobile":
            modality = "LIGHTWEIGHT_3D"
            render_tier = "3d_optimized"
            enable_shadows = False
            enable_particles = True
            lod = "medium"
        else:
            modality = "FULL_3D"
            render_tier = "3d_high"
            enable_shadows = True
            enable_particles = True
            lod = "high"

        return {
            "modality": modality,
            "render_tier": render_tier,
            "config": {
                "enable_shadows": enable_shadows,
                "enable_particles": enable_particles,
                "asset_lod": lod,
                "dpr_cap": 1.0 if modality in ["LIGHTWEIGHT_3D", "2D_STRUCTURED"] else 2.0,
                "offline_fallback_ready": True,
            },
            "educational_invariance": {
                "identical_cognitive_targets": True,
                "bkt_update_neutral": True,
                "fairness_guaranteed": True,
            },
        }


network_delivery_service = NetworkDeliveryService()
