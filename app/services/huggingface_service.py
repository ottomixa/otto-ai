from huggingface_hub import HfApi, ModelInfo, CardData
from typing import List, Optional, Tuple, Any, Dict
from ..schemas.model_schemas import HFModelBasic, HFModelDetail # Ensure correct relative import
# from ..core.config import settings # Assuming settings might be imported where instance is created

# Helper to safely get nested dictionary values
def get_nested_val(data: Optional[Dict[str, Any]], path: List[str], default: Optional[Any] = None) -> Optional[Any]:
    if not data:
        return default
    current = data
    for key in path:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current

def _transform_model_info(model_info: ModelInfo, is_detail: bool = False) -> Dict[str, Any]:
    """
    Transforms a Hugging Face ModelInfo object to a dictionary
    suitable for our HFModelBasic or HFModelDetail schema.
    Set is_detail=True to include more fields for HFModelDetail.
    """

    name = model_info.id
    creator = model_info.author

    description = None
    card_data_content = None

    if model_info.cardData: # cardData might be a dict or CardData object
        card_data_content = model_info.cardData.data if isinstance(model_info.cardData, CardData) else model_info.cardData

        if isinstance(card_data_content, dict):
            # Try common keys for summary/description
            description = card_data_content.get('model-summary') or \
                          card_data_content.get('model_description') or \
                          get_nested_val(card_data_content, ['model_card', 'overview']) or \
                          get_nested_val(card_data_content, ['model_card', 'summary'])

            if not description:
                readme_text = card_data_content.get('text')
                if isinstance(readme_text, str) and len(readme_text) > 0:
                    summary_marker = readme_text.lower().find("## model summary")
                    if summary_marker != -1:
                        summary_text_after_marker = readme_text[summary_marker:]
                        first_paragraph_after_marker = summary_text_after_marker.split('\n\n')[0]
                        description = (first_paragraph_after_marker[:300] + '...') if len(first_paragraph_after_marker) > 300 else first_paragraph_after_marker
                    else:
                        description = (readme_text[:300] + '...') if len(readme_text) > 300 else readme_text

    icon_url = None
    if hasattr(model_info, 'authorData') and model_info.authorData and isinstance(model_info.authorData, dict) and model_info.authorData.get('avatarUrl'):
        icon_url = model_info.authorData['avatarUrl']
    elif creator:
        icon_url = f"https://huggingface.co/{creator}/avatar_sm.jpeg"
    # else:
    #     icon_url = "/static/icons/default-model-icon.png"

    data_dict = {
        "id": model_info.id,
        "name": name,
        "creator": creator,
        "description": description,
        "iconUrl": icon_url,
        "tags": model_info.tags or [],
        "downloads": model_info.downloads if hasattr(model_info, 'downloads') else None,
        "lastModified": model_info.lastModified if hasattr(model_info, 'lastModified') else None,
    }

    if is_detail:
        data_dict["pipeline_tag"] = model_info.pipeline_tag
        data_dict["cardData"] = card_data_content
        data_dict["siblings"] = [sib.rfilename for sib in model_info.siblings] if model_info.siblings else []

    return data_dict


class HuggingFaceAPIService:
    def __init__(self, token: Optional[str] = None):
        self.hf_api = HfApi(token=token)

    def list_models_from_hf(
        self,
        search: Optional[str] = None,
        limit: int = 10,
        sort: str = "downloads",
        direction: str = "desc",
        page: int = 1
    ) -> Tuple[List[HFModelBasic], Optional[int]]:

        hf_direction = -1 if direction == "desc" else 1

        all_models_iterator = self.hf_api.list_models(
            search=search,
            sort=sort,
            direction=hf_direction,
            limit=limit * page if page > 0 else limit,
            cardData=True,
            full=False
        )

        all_fetched_models_list = list(all_models_iterator)

        start_index = (page - 1) * limit if page > 0 else 0
        end_index = start_index + limit
        paginated_models_info = all_fetched_models_list[start_index:end_index]

        transformed_models = [HFModelBasic(**_transform_model_info(mi, is_detail=False)) for mi in paginated_models_info]

        total_items_estimation = None
        if len(all_fetched_models_list) < (limit * page if page > 0 else limit):
            total_items_estimation = len(all_fetched_models_list)
        elif page == 1 and len(transformed_models) < limit:
            total_items_estimation = len(transformed_models)

        return transformed_models, total_items_estimation

    def get_model_details_from_hf(self, model_id: str, revision: Optional[str] = None) -> Optional[HFModelDetail]:
        try:
            model_info_obj: ModelInfo = self.hf_api.model_info(
                repo_id=model_id,
                revision=revision,
                files_metadata=True
            )
            if not model_info_obj:
                return None

            transformed_data = _transform_model_info(model_info_obj, is_detail=True)
            return HFModelDetail(**transformed_data)

        except Exception as e:
            print(f"Error fetching detailed model info for {model_id}: {e}")
            return None

# Example of how huggingface_service_instance might be created in hf_models.py or main.py:
# from app.core.config import settings
# huggingface_service_instance = HuggingFaceAPIService(token=settings.HF_TOKEN)
