CREATE VIEW `entities_with_skills` AS 
    SELECT
      entities.id AS entity_id,
      entities.game_id AS entity_game_id,
      entities.name AS entity_name,
      entities.type AS entity_type,
      entities.icon_url AS entity_icon_url,
      entities.description AS entity_description,
      entities.rank,
      entities.weapon_type,
      entities.attribute,
      entities.echo_set_ids,
      entities.cost,
      entities.set_bonus_thresholds,
      skills.id AS skill_id,
      skills.game_id AS skill_game_id,
      skills.name AS skill_name,
      skills.description AS skill_description,
      skills.icon_url AS skill_icon_url,
      skills.origin_type AS skill_origin_type,
    FROM entities
    LEFT JOIN skills ON entities.id = skills.entity_id
  ;