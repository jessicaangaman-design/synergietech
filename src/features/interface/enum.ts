export enum RoleSTS {
  SUPERADMIN = "SUPERADMIN",
  SECRETAIRE = "SECRETAIRE",
  ADMIN = "ADMIN",
  COMMERCIAL = "COMMERCIAL",
  TECHNICIEN = "TECHNICIEN",
  USER = "USER",
}

export enum TypeBesoin {
  VIDEOSURVEILLANCE = "VIDEOSURVEILLANCE",
  CONTROLE_ACCES = "CONTROLE_ACCES",
  CLOTURE_ELECTRIQUE = "CLOTURE_ELECTRIQUE",
  MOTORISATION_PORTAIL = "MOTORISATION_PORTAIL",
  INCENDIE = "INCENDIE",
  ALARME = "ALARME",
  RADIO = "RADIO",
}

export enum SourceProspect {
  RECOMMANDATION = "RECOMMANDATION",
  SITE_WEB = "SITE_WEB",
  APPEL_DIRECT = "APPEL_DIRECT",
  RESEAUX_SOCIAUX = "RESEAUX_SOCIAUX",
  AUTRE = "AUTRE",
}

export enum StatutProspect {
  NOUVEAU = "NOUVEAU",
  CONTACTE = "CONTACTE",
  DEVIS_ENVOYE = "DEVIS_ENVOYE",
  NEGOCIATION = "NEGOCIATION",
  GAGNE = "GAGNE",
  CONVERTI = "CONVERTI",
  PERDU = "PERDU",
}

export enum MotifPerte {
  PRIX = "PRIX",
  CONCURRENT = "CONCURRENT",
  DELAI = "DELAI",
  BESOIN_ANNULE = "BESOIN_ANNULE",
  SANS_REPONSE = "SANS_REPONSE",
  AUTRE = "AUTRE",
}

export enum TypeContrat {
  INSTALLATION_PONCTUELLE = "INSTALLATION PONCTUELLE",
  MAINTENANCE = "MAINTENANCE",
  ABONNEMENT = "ABONNEMENT",
}

export enum StatutContrat {
  BROUILLON = "BROUILLON",
  ACTIF = "ACTIF",
  RENOUVELLEMENT = "RENOUVELLEMENT",
  EXPIRE = "EXPIRE",
  RESILIE = "RESILIE",
}

export enum MotifResiliation {
  INSATISFACTION = "INSATISFACTION",
  PRIX = "PRIX",
  DEMENAGEMENT = "DEMENAGEMENT",
  FERMETURE_ACTIVITE = "FERMETURE_ACTIVITE",
  AUTRE = "AUTRE",
}

export enum TypeIntervention {
  INSTALLATION = "INSTALLATION",
  MAINTENANCE_PREVENTIVE = "MAINTENANCE_PREVENTIVE",
  DEPANNAGE = "DEPANNAGE",
  CONTROLE_PERIODIQUE = "CONTROLE_PERIODIQUE",
}

export enum StatutIntervention {
  PLANIFIEE = "PLANIFIEE",
  EN_COURS = "EN_COURS",
  TERMINEE = "TERMINEE",
  ANNULEE = "ANNULEE",
}

export enum ApplyStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum TypeApplicant {
  Electricien = "Electricien",
  Plombier = "Plombier",
  Mecanicien = "Mecanicien",
  Charpentier = "Charpentier",
  Peintre = "Peintre",
  Chauffeur = "Chauffeur",
  Vitrier = "Vitrier",
  Climatisation_Specialiste = "Climatisation_Specialiste",
  Ferronnier = "Ferronnier",
  Securite_Electronique = "Securite_Electronique",
  Peinture_et_Design = "Peinture_et_Design",
  Alucobond = "Alucobond",
  Etancheite = "Etancheite",
  Serrurier = "Serrurier",
  Maconnerie = "Maconnerie",
  Revetement_Sol = "Revetement_Sol",
  Ebeniste = "Ebeniste",
  Chauffage_et_Ventilation = "Chauffage_et_Ventilation",
  Renovation_Interieure = "Renovation_Interieure",
  Jardinage_et_Amenagement = "Jardinage_et_Amenagement",
  Nettoyage_Professionnel = "Nettoyage_Professionnel",
  Demenagement = "Demenagement",
  Gestion_Des_Dechets = "Gestion_Des_Dechets",
  Decoration_Interieure = "Decoration_Interieure",
  Entretien_Espaces_Verts = "Entretien_Espaces_Verts",
  Menuisier = "Menuisier",
}
